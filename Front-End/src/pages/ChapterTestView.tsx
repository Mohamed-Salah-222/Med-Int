import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer, TestSession } from "../types";
import { AlertCircle, CheckCircle, XCircle, Clock, Target, ArrowLeft, Trophy, BookOpen, AlertTriangle, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";

interface TestSubmitResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  results: Array<{
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

function ChapterTestView() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Initial states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  // Test states
  const [testStarted, setTestStarted] = useState(false);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<TestSubmitResponse | null>(null);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerRef = useRef<number | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Access check
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await courseAPI.checkChapterTestAccess(id!);
        setAccessAllowed(response.data.canAccess);
      } catch (error: any) {
        setAccessAllowed(false);
        setError(error.response?.data?.message || "Access denied");
      } finally {
        setAccessLoading(false);
      }
    };

    checkAccess();
  }, [id]);

  // Start timer when question changes
  useEffect(() => {
    if (testStarted && testSession && !submitted) {
      setTimeRemaining(60);
      hasAutoSubmitted.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-submit current answer
            if (!hasAutoSubmitted.current) {
              hasAutoSubmitted.current = true;
              handleNextQuestion();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [testSession?.currentQuestionIndex, testStarted, submitted]);

  // Page leave protection
  useEffect(() => {
    if (testStarted && !submitted) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "If you leave this page, your test will be marked as abandoned and you'll have to wait 3 hours to retake it.";
        return e.returnValue;
      };

      const handleVisibilityChange = async () => {
        if (document.hidden && testSession) {
          // User left the tab - abandon test
          try {
            await courseAPI.abandonChapterTest(id!, testSession.sessionId);
          } catch (error) {
            console.error("Error abandoning test:", error);
          }
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [testStarted, submitted, testSession, id]);

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.startChapterTest(id!);

      setTestSession({
        sessionId: response.data.sessionId,
        questions: response.data.test.questions,
        answers: new Array(response.data.test.questions.length).fill(null),
        currentQuestionIndex: 0,
        timeRemaining: 60,
        testStartTime: Date.now(),
      });

      setTestStarted(true);
    } catch (error: any) {
      console.error("Error starting test:", error);
      if (error.response?.status === 403) {
        setError(error.response.data.message || "Cannot start test");
      } else {
        setError("Failed to start test");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!testSession) return;

    // Save current answer
    const newAnswers = [...testSession.answers];
    newAnswers[testSession.currentQuestionIndex] = currentAnswer || null;

    // Check if this is the last question
    if (testSession.currentQuestionIndex === testSession.questions.length - 1) {
      // Submit test
      handleSubmitTest(newAnswers);
    } else {
      // Move to next question
      setTestSession({
        ...testSession,
        answers: newAnswers,
        currentQuestionIndex: testSession.currentQuestionIndex + 1,
      });
      setCurrentAnswer("");
    }
  };

  const handleSubmitTest = async (finalAnswers: (string | null)[]) => {
    if (!testSession) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const formattedAnswers: QuizAnswer[] = testSession.questions.map((q, index) => ({
      questionId: q._id,
      selectedAnswer: finalAnswers[index] || "",
    }));

    try {
      const response = await courseAPI.submitChapterTest(id!, testSession.sessionId, formattedAnswers);
      setResults(response.data);
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test. Please try again.");
    }
  };

  // Loading states
  if (accessLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Checking access...</div>
        </div>
      </Layout>
    );
  }

  if (!accessAllowed) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Chapter Test Locked</h2>
            <p className="text-[#6B6B6B] mb-6">{error}</p>
            <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <Clock className="w-24 h-24 text-[#7A9D96] mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">{error}</h2>
            <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">Please complete all lessons in this chapter before taking the test.</p>
            <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all shadow-md">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Results view
  if (submitted && results) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#FAFAF8] py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Results Summary */}
            <div className={`rounded-2xl shadow-xl p-12 mb-8 ${results.passed ? "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500" : "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500"}`}>
              <div className="text-center">
                {results.passed ? <Trophy className="w-20 h-20 text-green-600 mx-auto mb-6" strokeWidth={1.5} /> : <BookOpen className="w-20 h-20 text-red-600 mx-auto mb-6" strokeWidth={1.5} />}
                <h1 className="text-4xl font-bold mb-4 text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  {results.passed ? "Chapter Test Passed!" : "Keep Studying!"}
                </h1>
                <div className="text-6xl font-bold mb-4 text-[#2C2C2C]">{results.score}%</div>
                <p className="text-xl text-[#6B6B6B] mb-2">
                  You answered {results.correctCount} out of {results.totalQuestions} questions correctly
                </p>
                {results.passed ? <p className="text-lg text-green-700 font-semibold">Great work! You can now proceed to the next chapter.</p> : <p className="text-lg text-red-700 font-semibold">You need {results.passingScore}% to pass. Review the material and try again after 3 hours.</p>}
              </div>
            </div>

            {/* Question Results */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center">
                <Target className="w-6 h-6 text-[#7A9D96] mr-3" />
                Answer Review
              </h2>
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={result.questionId} className={`p-6 rounded-xl border-2 ${result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-start mb-4">
                      {result.isCorrect ? <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" /> : <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />}
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-bold text-[#2C2C2C] mr-2">Question {index + 1}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${result.isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{result.isCorrect ? "Correct" : "Incorrect"}</span>
                        </div>
                        <p className="text-[#2C2C2C] mb-3">{result.questionText}</p>
                      </div>
                    </div>

                    <div className="ml-9 space-y-2">
                      <div className={`font-medium ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>Your answer: {result.selectedAnswer}</div>
                      {!result.isCorrect && <div className="font-medium text-green-700">Correct answer: {result.correctAnswer}</div>}
                      {result.explanation && (
                        <div className="bg-white/50 p-3 rounded-lg mt-3 border border-[#E8E8E6]">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-[#7A9D96] mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-[#6B6B6B]">{result.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all shadow-md flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Test not started yet - show start screen
  if (!testStarted) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#FAFAF8] py-12">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-[#E8E8E6]">
              <div className="text-center mb-8">
                <Target className="w-20 h-20 text-[#7A9D96] mx-auto mb-6" strokeWidth={1.5} />
                <h1 className="text-4xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Chapter Test
                </h1>
                <p className="text-xl text-[#6B6B6B]">Ready to test your knowledge?</p>
              </div>

              {/* Critical Warning */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <AlertTriangle className="w-7 h-7 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-xl text-[#2C2C2C] mb-3">⚠️ IMPORTANT - READ CAREFULLY</p>
                    <ul className="space-y-2 text-[#6B6B6B]">
                      <li className="flex items-start">
                        <Clock className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>1 minute per question</strong> - answer auto-submits when time expires
                        </span>
                      </li>
                      <li className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Do NOT leave this page</strong> - test will be marked as failed
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>20 random questions from the chapter</span>
                      </li>
                      <li className="flex items-start">
                        <Target className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>70% passing score required</span>
                      </li>
                      <li className="flex items-start">
                        <Clock className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>3-hour cooldown</strong> if you fail or abandon
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={handleStartTest} disabled={loading} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-12 py-5 rounded-lg font-bold text-xl hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-3">
                  <Target className="w-7 h-7" />
                  <span>{loading ? "Starting..." : "Start Chapter Test"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Test in progress - show current question
  if (testSession) {
    const currentQuestion = testSession.questions[testSession.currentQuestionIndex];
    const progress = ((testSession.currentQuestionIndex + 1) / testSession.questions.length) * 100;

    return (
      <Layout>
        <div className="min-h-screen bg-[#FAFAF8] py-12">
          <div className="max-w-3xl mx-auto px-6">
            {/* Progress Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#2C2C2C]">
                    Question {testSession.currentQuestionIndex + 1} of {testSession.questions.length}
                  </h2>
                  <p className="text-sm text-[#6B6B6B]">Chapter Test in Progress</p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${timeRemaining <= 10 ? "text-red-600" : "text-[#7A9D96]"}`}>{timeRemaining}s</div>
                  <div className="text-xs text-[#6B6B6B]">Time Left</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#E8E8E6] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800 font-semibold">Do not leave this page or your test will be marked as abandoned!</p>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E8E8E6]">
              <p className="text-2xl text-[#2C2C2C] mb-8 leading-relaxed">{currentQuestion.questionText}</p>

              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all ${currentAnswer === option ? "border-[#7A9D96] bg-[#7A9D96]/10 shadow-md" : "border-[#E8E8E6] hover:border-[#7A9D96]/50 hover:bg-[#FAFAF8]"}`}>
                    <input type="radio" name="answer" value={option} checked={currentAnswer === option} onChange={(e) => setCurrentAnswer(e.target.value)} className="w-6 h-6 text-[#7A9D96] mr-4 cursor-pointer" />
                    <span className="text-lg text-[#2C2C2C] font-medium">{option}</span>
                  </label>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button onClick={handleNextQuestion} disabled={!currentAnswer} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-10 py-4 rounded-lg font-bold text-lg hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-2">
                  <span>{testSession.currentQuestionIndex === testSession.questions.length - 1 ? "Submit Test" : "Next Question"}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}

export default ChapterTestView;
