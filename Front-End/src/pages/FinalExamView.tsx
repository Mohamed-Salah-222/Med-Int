import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer } from "../types";
import { AlertTriangle, CheckCircle, XCircle, Award, ArrowLeft, Trophy, Shield, AlertCircle, Target, BookOpen, ArrowRight, Clock } from "lucide-react";
import Layout from "../components/Layout";

interface TestSession {
  sessionId: string;
  questions: Question[];
  answers: (string | null)[];
  currentQuestionIndex: number;
  timeRemaining: number;
  testStartTime: number;
}

interface ExamSubmitResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  courseCompleted: boolean;
  certificateIssued: boolean;
  certificates?: {
    main: {
      certificateNumber: string;
      verificationCode: string;
      issuedAt: string;
    };
    hipaa: {
      certificateNumber: string;
      verificationCode: string;
      issuedAt: string;
    };
  };
  results: Array<{
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

function FinalExamView() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Initial states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");

  // Exam states
  const [examStarted, setExamStarted] = useState(false);
  const [examSession, setExamSession] = useState<TestSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ExamSubmitResponse | null>(null);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerRef = useRef<number | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Access check
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await courseAPI.checkFinalExamAccess();
        setAccessAllowed(response.data.canAccess);
      } catch (error: any) {
        setAccessAllowed(false);
        setAccessMessage(error.response?.data?.message || "Access denied");
      } finally {
        setAccessLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Start timer when question changes
  useEffect(() => {
    if (examStarted && examSession && !submitted) {
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
  }, [examSession?.currentQuestionIndex, examStarted, submitted]);

  // Page leave protection + Tab switch detection
  useEffect(() => {
    if (examStarted && !submitted && examSession) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "If you leave this page, your final exam will be marked as abandoned and you'll have to wait 24 hours to retake it.";
        return e.returnValue;
      };

      const handleVisibilityChange = async () => {
        if (document.hidden) {
          // User switched tabs or minimized window - abandon exam
          try {
            await courseAPI.abandonFinalExam(id!, examSession.sessionId);
            // Immediately show abandonment message
            setExamStarted(false);
            setSubmitted(true);
            setError("Exam abandoned: You switched tabs or left the page. 24-hour cooldown activated.");
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
          } catch (error) {
            console.error("Error abandoning exam:", error);
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
  }, [examStarted, submitted, examSession, id]);

  const handleStartExam = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.startFinalExam(id!);

      setExamSession({
        sessionId: response.data.sessionId,
        questions: response.data.exam.questions,
        answers: new Array(response.data.exam.questions.length).fill(null),
        currentQuestionIndex: 0,
        timeRemaining: 60,
        testStartTime: Date.now(),
      });

      setExamStarted(true);
    } catch (error: any) {
      console.error("Error starting exam:", error);
      if (error.response?.status === 403) {
        setError(error.response.data.message || "Cannot start exam");
      } else {
        setError("Failed to start exam");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!examSession) return;

    // Save current answer
    const newAnswers = [...examSession.answers];
    newAnswers[examSession.currentQuestionIndex] = currentAnswer || null;

    // Check if this is the last question
    if (examSession.currentQuestionIndex === examSession.questions.length - 1) {
      // Submit exam
      handleSubmitExam(newAnswers);
    } else {
      // Move to next question
      setExamSession({
        ...examSession,
        answers: newAnswers,
        currentQuestionIndex: examSession.currentQuestionIndex + 1,
      });
      setCurrentAnswer("");
    }
  };

  const handleSubmitExam = async (finalAnswers: (string | null)[]) => {
    if (!examSession) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const formattedAnswers: QuizAnswer[] = examSession.questions.map((q, index) => ({
      questionId: q._id,
      selectedAnswer: finalAnswers[index] || "",
    }));

    try {
      const response = await courseAPI.submitFinalExam(id!, examSession.sessionId, formattedAnswers);
      setResults(response.data);
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      alert("Failed to submit exam. Please try again.");
    }
  };

  // Loading states
  if (accessLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
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
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Final Exam Locked</h2>
            <p className="text-[#6B6B6B] mb-6">{accessMessage || "You must pass all chapter tests first."}</p>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Abandoned exam
  if (error && submitted && !results) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">Exam Abandoned</h2>
            <p className="text-lg text-[#6B6B6B] mb-2">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">You must wait 24 hours before attempting the final exam again.</p>
            </div>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
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
        <div className="bg-[#FAFAF8] py-12" style={{ fontFamily: "Lexend, sans-serif" }}>
          <div className="max-w-4xl mx-auto px-6">
            {/* Results Summary */}
            <div className={`rounded-2xl shadow-lg p-8 mb-8 relative overflow-hidden border-2 ${results.passed ? "bg-gradient-to-br from-purple-600/10 to-purple-800/5 border-purple-600" : "bg-gradient-to-br from-[#E76F51]/10 to-orange-100/50 border-[#E76F51]"}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>

              <div className="text-center relative z-10">
                <div className="mb-4 inline-block">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${results.passed ? "bg-gradient-to-br from-purple-600 to-purple-800" : "bg-gradient-to-br from-[#E76F51] to-orange-500"}`}>{results.passed ? <Trophy className="w-10 h-10 text-white" strokeWidth={2} /> : <BookOpen className="w-10 h-10 text-white" strokeWidth={2} />}</div>
                </div>

                <h1 className="text-4xl font-bold mb-3 text-[#2C2C2C]">{results.passed ? "🎉 Congratulations!" : "Keep Trying!"}</h1>

                <div className="mb-4">
                  <div className="text-7xl font-bold text-[#2C2C2C] mb-2">{results.score}%</div>
                  <p className="text-lg text-[#6B6B6B]">
                    {results.correctCount} out of {results.totalQuestions} correct
                  </p>
                </div>

                {results.passed ? <p className="text-base text-purple-700 font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">You have completed the course and earned your certificates!</p> : <p className="text-base text-[#E76F51] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">Wait 24 hours to retry</p>}
              </div>
            </div>

            {/* Certificates Preview */}
            {results.passed && results.certificates && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
                <h3 className="text-3xl font-bold text-[#2C2C2C] mb-6 flex items-center justify-center">
                  <Award className="w-8 h-8 text-purple-600 mr-3" />
                  Your Certificates
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Main Certificate */}
                  <div className="border-2 border-purple-600 rounded-xl p-6 bg-purple-50 hover:shadow-md transition-all">
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-xl mb-3 text-[#2C2C2C] text-center">Medical Interpreter</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-[#6B6B6B]">
                        Certificate #: <span className="font-mono text-[#2C2C2C] font-semibold block mt-1">{results.certificates.main.certificateNumber}</span>
                      </p>
                      <p className="text-[#6B6B6B]">
                        Verification: <span className="font-mono text-[#2C2C2C] font-semibold block mt-1">{results.certificates.main.verificationCode}</span>
                      </p>
                    </div>
                  </div>

                  {/* HIPAA Certificate */}
                  <div className="border-2 border-[#2C2C2C] rounded-xl p-6 bg-[#2C2C2C]/5 hover:shadow-md transition-all">
                    <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-xl mb-3 text-[#2C2C2C] text-center">HIPAA Compliance</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-[#6B6B6B]">
                        Certificate #: <span className="font-mono text-[#2C2C2C] font-semibold block mt-1">{results.certificates.hipaa.certificateNumber}</span>
                      </p>
                      <p className="text-[#6B6B6B]">
                        Verification: <span className="font-mono text-[#2C2C2C] font-semibold block mt-1">{results.certificates.hipaa.verificationCode}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-100 border border-purple-300 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-800 flex items-center justify-center font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Certificates have been sent to your email
                  </p>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => navigate(`/certificate/${id}`)} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center space-x-2 group cursor-pointer">
                    <Award className="w-6 h-6" />
                    <span>View Full Certificates</span>
                  </button>
                </div>
              </div>
            )}

            {/* Question Results */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center">
                <Target className="w-7 h-7 text-purple-600 mr-3" />
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
              <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2 group cursor-pointer">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Exam not started yet
  if (!examStarted) {
    return (
      <Layout>
        <div className="bg-[#FAFAF8] py-12" style={{ fontFamily: "Lexend, sans-serif" }}>
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-[#E8E8E6]">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Trophy className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3">Final Exam</h1>
                <p className="text-lg text-[#6B6B6B]">Your last step to certification</p>
              </div>

              {/* Warning */}
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
                          <strong>100 random questions</strong> from the question bank
                        </span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          <strong>1 minute per question</strong> - auto-submits when time expires
                        </span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          <strong>Do NOT switch tabs</strong> - exam will be abandoned instantly
                        </span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>80% passing score</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          <strong>24-hour cooldown</strong> if you fail or abandon
                        </span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                        <span>
                          Pass to earn <strong>TWO certificates</strong> (Medical Interpreter + HIPAA)
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-center">
                <button onClick={handleStartExam} disabled={loading} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-3 group cursor-pointer">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-6 h-6" />
                      <span>Start Final Exam</span>
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

  // Exam in progress
  if (examSession) {
    const currentQuestion = examSession.questions[examSession.currentQuestionIndex];
    const progress = ((examSession.currentQuestionIndex + 1) / examSession.questions.length) * 100;

    return (
      <Layout>
        <div className="bg-[#FAFAF8] py-12" style={{ fontFamily: "Lexend, sans-serif" }}>
          <div className="max-w-2xl mx-auto px-4">
            {/* Progress Header */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C]">
                    Question {examSession.currentQuestionIndex + 1}/{examSession.questions.length}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B6B6B]">Final Exam</p>
                </div>
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl font-bold ${timeRemaining <= 10 ? "text-red-600 animate-pulse" : "text-purple-600"}`}>{timeRemaining}s</div>
                  <div className="text-xs text-[#6B6B6B]">Time Left</div>
                </div>
              </div>

              <div className="w-full bg-[#E8E8E6] rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[#E76F51]/10 border-l-4 border-[#E76F51] rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-[#E76F51] font-semibold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                Do not switch tabs or leave this page!
              </p>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-[#E8E8E6]">
              <p className="text-lg sm:text-xl text-[#2C2C2C] mb-6 leading-relaxed font-medium">{currentQuestion.questionText}</p>

              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${currentAnswer === option ? "border-purple-600 bg-purple-50 shadow-sm" : "border-[#E8E8E6] hover:border-purple-400 hover:bg-[#FAFAF8]"}`}>
                    <input type="radio" name="answer" value={option} checked={currentAnswer === option} onChange={(e) => setCurrentAnswer(e.target.value)} className="w-5 h-5 text-purple-600 mr-3 cursor-pointer flex-shrink-0" />
                    <span className="text-sm sm:text-base text-[#2C2C2C] font-medium leading-snug">{option}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button onClick={handleNextQuestion} disabled={!currentAnswer} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-10 py-3 rounded-xl font-bold hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-2 group cursor-pointer">
                  <span>{examSession.currentQuestionIndex === examSession.questions.length - 1 ? "Submit Exam" : "Next Question"}</span>
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

export default FinalExamView;
