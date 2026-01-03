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

  // Page leave protection + Tab switch detection
  useEffect(() => {
    if (testStarted && !submitted && testSession) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "If you leave this page, your test will be marked as abandoned and you'll have to wait 3 hours to retake it.";
        return e.returnValue;
      };

      const handleVisibilityChange = async () => {
        if (document.hidden) {
          // User switched tabs or minimized window - abandon test
          try {
            await courseAPI.abandonChapterTest(id!, testSession.sessionId);
            // Immediately show abandonment message
            setTestStarted(false);
            setSubmitted(true);
            setError("Test abandoned: You switched tabs or left the page. 3-hour cooldown activated.");
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
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
      window.scrollTo(0, 0);
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Checking access...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!accessAllowed) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Chapter Test Locked</h2>
            <p className="text-[#6B6B6B] mb-6">{error}</p>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !testStarted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
          <div className="text-center max-w-md">
            <Clock className="w-20 h-20 text-[#7A9D96] mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">{error}</h2>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Abandoned test
  if (error && submitted && !results) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">Test Abandoned</h2>
            <p className="text-lg text-[#6B6B6B] mb-2">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">You must wait 3 hours before attempting this test again.</p>
            </div>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Results view - POLISHED
  if (submitted && results) {
    return (
      <Layout>
        <div className="bg-[#FAFAF8] py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Results Summary - WARM COLORS */}
            <div className={`rounded-2xl shadow-lg p-8 mb-8 relative overflow-hidden border-2 ${results.passed ? "bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/5 border-[#7A9D96]" : "bg-gradient-to-br from-[#E76F51]/10 to-orange-100/50 border-[#E76F51]"}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>

              <div className="text-center relative z-10">
                <div className="mb-4 inline-block">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${results.passed ? "bg-gradient-to-br from-[#7A9D96] to-[#6A8D86]" : "bg-gradient-to-br from-[#E76F51] to-orange-500"}`}>{results.passed ? <Trophy className="w-8 h-8 text-white" strokeWidth={2} /> : <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />}</div>
                </div>

                <h1 className="text-3xl font-bold mb-3 text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  {results.passed ? "Chapter Test Passed" : "Keep Studying"}
                </h1>

                <div className="mb-4">
                  <div className="text-6xl font-bold text-[#2C2C2C] mb-2">{results.score}%</div>
                  <p className="text-lg text-[#6B6B6B]">
                    {results.correctCount} out of {results.totalQuestions} correct
                  </p>
                </div>

                {results.passed ? <p className="text-base text-[#7A9D96] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">Great work! You can now proceed to the next chapter</p> : <p className="text-base text-[#E76F51] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">Pass score: {results.passingScore}% • Wait 3 hours to retry</p>}
              </div>
            </div>

            {/* Question Results - REFINED */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center" style={{ fontFamily: "Lexend, sans-serif" }}>
                <Target className="w-7 h-7 text-[#7A9D96] mr-3" />
                Detailed Review
              </h2>
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={result.questionId} className={`p-6 rounded-xl border-2 transition-all hover:shadow-md ${result.isCorrect ? "bg-[#7A9D96]/5 border-[#7A9D96]/30" : "bg-[#E76F51]/5 border-[#E76F51]/30"}`}>
                    <div className="flex items-start mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4 ${result.isCorrect ? "bg-[#7A9D96]" : "bg-[#E76F51]"}`}>{result.isCorrect ? <CheckCircle className="w-6 h-6 text-white" strokeWidth={3} /> : <XCircle className="w-6 h-6 text-white" strokeWidth={3} />}</div>
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="font-bold text-lg text-[#2C2C2C] mr-3">Question {index + 1}</span>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${result.isCorrect ? "bg-[#7A9D96] text-white" : "bg-[#E76F51] text-white"}`}>{result.isCorrect ? "Correct" : "Incorrect"}</span>
                        </div>
                        <p className="text-[#2C2C2C] text-base mb-4 leading-relaxed">{result.questionText}</p>

                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg font-semibold border-2 ${result.isCorrect ? "bg-[#7A9D96]/10 border-[#7A9D96]/30 text-[#7A9D96]" : "bg-[#E76F51]/10 border-[#E76F51]/30 text-[#E76F51]"}`}>
                            <span className="text-sm opacity-75">Your answer:</span>
                            <div className="text-base mt-1">{result.selectedAnswer}</div>
                          </div>

                          {!result.isCorrect && (
                            <div className="p-3 rounded-lg bg-[#7A9D96]/10 border-2 border-[#7A9D96]/30 font-semibold text-[#7A9D96]">
                              <span className="text-sm opacity-75">Correct answer:</span>
                              <div className="text-base mt-1">{result.correctAnswer}</div>
                            </div>
                          )}

                          {result.explanation && (
                            <div className="bg-blue-50/50 border-l-4 border-[#7A9D96] p-4 rounded-r-lg">
                              <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-[#7A9D96] mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-[#2C2C2C] mb-1">Explanation:</p>
                                  <p className="text-sm text-[#6B6B6B]">{result.explanation}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2 group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
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
        <div className="bg-[#FAFAF8] py-12">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-[#E8E8E6]">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Chapter Test
                </h1>
                <p className="text-lg text-[#6B6B6B]">Ready to test your knowledge?</p>
              </div>

              {/* Critical Warning - COMPACT */}
              <div className="bg-gradient-to-r from-[#E76F51]/10 to-orange-100/50 border-l-4 border-[#E76F51] rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <div className="bg-[#E76F51] rounded-lg p-2 mr-3 flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#2C2C2C] mb-3">Important Rules</p>
                    <ul className="space-y-2 text-sm text-[#6B6B6B]">
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          <strong>1 minute per question</strong> - auto-submits when time expires
                        </span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          <strong>Do NOT switch tabs</strong> - test will be abandoned instantly
                        </span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>20 random questions • 70% passing score</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          <strong>3-hour cooldown</strong> if you fail or abandon
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={handleStartTest} disabled={loading} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-3 group">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-6 h-6" />
                      <span>Start Chapter Test</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Test in progress - COMPACT OPTIONS
  if (testSession) {
    const currentQuestion = testSession.questions[testSession.currentQuestionIndex];
    const progress = ((testSession.currentQuestionIndex + 1) / testSession.questions.length) * 100;

    return (
      <Layout>
        <div className="bg-[#FAFAF8] py-12">
          <div className="max-w-2xl mx-auto px-4">
            {/* Compact Progress Header */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C]">
                    Question {testSession.currentQuestionIndex + 1}/{testSession.questions.length}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B6B6B]">Chapter Test</p>
                </div>
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl font-bold ${timeRemaining <= 10 ? "text-red-600 animate-pulse" : "text-[#7A9D96]"}`}>{timeRemaining}s</div>
                  <div className="text-xs text-[#6B6B6B]">Time Left</div>
                </div>
              </div>

              <div className="w-full bg-[#E8E8E6] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {/* Compact Warning */}
            <div className="bg-[#E76F51]/10 border-l-4 border-[#E76F51] rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-[#E76F51] font-semibold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                Do not switch tabs or leave this page!
              </p>
            </div>

            {/* Compact Question Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-[#E8E8E6]">
              <p className="text-lg sm:text-xl text-[#2C2C2C] mb-6 leading-relaxed font-medium">{currentQuestion.questionText}</p>

              {/* COMPACT OPTIONS - NO SCROLL */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${currentAnswer === option ? "border-[#7A9D96] bg-[#7A9D96]/10 shadow-sm" : "border-[#E8E8E6] hover:border-[#7A9D96]/50 hover:bg-[#FAFAF8]"}`}>
                    <input type="radio" name="answer" value={option} checked={currentAnswer === option} onChange={(e) => setCurrentAnswer(e.target.value)} className="w-5 h-5 text-[#7A9D96] mr-3 cursor-pointer flex-shrink-0" />
                    <span className="text-sm sm:text-base text-[#2C2C2C] font-medium leading-snug">{option}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button onClick={handleNextQuestion} disabled={!currentAnswer} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-10 py-3 rounded-xl font-bold hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-2 group">
                  <span>{testSession.currentQuestionIndex === testSession.questions.length - 1 ? "Submit Test" : "Next Question"}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
