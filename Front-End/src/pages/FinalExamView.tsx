import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer } from "../types";
import { AlertTriangle, CheckCircle, XCircle, Award, ArrowLeft, Trophy, Shield, AlertCircle, Target, BookOpen } from "lucide-react";
import Layout from "../components/Layout";

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passingScore, setPassingScore] = useState(80);
  const [timeLimit, setTimeLimit] = useState(100);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ExamSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await courseAPI.getFinalExam(id!);
        setQuestions(response.data.exam.questions);
        setPassingScore(response.data.exam.passingScore);
        setTimeLimit(response.data.exam.timeLimit);
      } catch (error: any) {
        console.error("Error fetching exam:", error);
        if (error.response?.status === 403) {
          setError(error.response.data.message || "You cannot take the final exam yet");
        } else {
          setError("Failed to load exam");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id]);

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

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    const allAnswered = questions.every((q) => answers[q._id]);

    if (!allAnswered) {
      alert("Please answer all questions before submitting.");
      return;
    }

    if (!confirm("Are you sure you want to submit your FINAL EXAM? You can only retake after 24 hours.")) {
      return;
    }

    const formattedAnswers: QuizAnswer[] = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id],
    }));

    try {
      const response = await courseAPI.submitFinalExam(id!, formattedAnswers);
      setResults(response.data);
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      if (error.response?.status === 403) {
        alert(error.response.data.message || "Exam is on cooldown");
      } else {
        alert("Failed to submit exam. Please try again.");
      }
    }
  };

  if (loading || accessLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">{accessLoading ? "Checking access..." : "Loading final exam..."}</p>
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">Final Exam Locked</h2>
            <p className="text-lg text-[#6B6B6B] mb-6">{accessMessage || "You must pass all chapter tests before taking the final exam."}</p>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
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
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">{error}</h2>
            <p className="text-lg text-[#6B6B6B] mb-6">Please complete all chapter tests before taking the final exam.</p>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted && results) {
    return (
      <Layout>
        <div className="bg-[#FAFAF8] py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Results Summary - POLISHED */}
            <div className={`rounded-2xl shadow-lg p-8 mb-8 relative overflow-hidden border-2 ${results.passed ? "bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/5 border-[#7A9D96]" : "bg-gradient-to-br from-[#E76F51]/10 to-orange-100/50 border-[#E76F51]"}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>

              <div className="text-center relative z-10">
                <div className="mb-4 inline-block">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${results.passed ? "bg-gradient-to-br from-[#7A9D96] to-[#6A8D86]" : "bg-gradient-to-br from-[#E76F51] to-orange-500"}`}>{results.passed ? <Trophy className="w-10 h-10 text-white" strokeWidth={2} /> : <BookOpen className="w-10 h-10 text-white" strokeWidth={2} />}</div>
                </div>

                <h1 className="text-4xl font-bold mb-3 text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  {results.passed ? "Congratulations!" : "Keep Trying!"}
                </h1>

                <div className="mb-4">
                  <div className="text-7xl font-bold text-[#2C2C2C] mb-2">{results.score}%</div>
                  <p className="text-lg text-[#6B6B6B]">
                    {results.correctCount} out of {results.totalQuestions} correct
                  </p>
                </div>

                {results.passed ? <p className="text-base text-[#7A9D96] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">🎉 You have completed the course and earned your certificates!</p> : <p className="text-base text-[#E76F51] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">Pass score: {passingScore}% • Wait 24 hours to retry</p>}
              </div>
            </div>

            {/* Certificates Preview - POLISHED */}
            {results.passed && results.certificates && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
                <h3 className="text-3xl font-bold text-[#2C2C2C] mb-6 flex items-center justify-center" style={{ fontFamily: "Lexend, sans-serif" }}>
                  <Award className="w-8 h-8 text-[#7A9D96] mr-3" />
                  Your Certificates
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Main Certificate Preview */}
                  <div className="border-2 border-[#7A9D96] rounded-xl p-6 bg-[#7A9D96]/5 hover:shadow-md transition-all">
                    <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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

                  {/* HIPAA Certificate Preview */}
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

                <div className="bg-[#7A9D96]/10 border border-[#7A9D96]/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#7A9D96] flex items-center justify-center font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Certificates have been sent to your email
                  </p>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => navigate(`/certificate/${id}`)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center space-x-2 group">
                    <Award className="w-6 h-6" />
                    <span>View Full Certificates</span>
                  </button>
                </div>
              </div>
            )}

            {/* Question Results - POLISHED */}
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

            {/* Action Button */}
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

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <Layout>
      <div className="bg-[#FAFAF8] py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header - POLISHED */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                    Final Exam
                  </h1>
                  <p className="text-xl text-purple-100">Your last step to certification</p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl sm:text-5xl font-bold">
                  {answeredCount}/{questions.length}
                </div>
                <div className="text-lg text-purple-100">Questions Answered</div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-purple-900/30 rounded-full h-3">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-3 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          </div>

          {/* Critical Warning - COMPACT & POLISHED */}
          <div className="bg-gradient-to-r from-[#E76F51]/10 to-orange-100/50 border-l-4 border-[#E76F51] rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="bg-[#E76F51] rounded-lg p-2 mr-3 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-[#2C2C2C] mb-3">⚠️ Final Exam Rules</p>
                <ul className="space-y-2 text-sm text-[#6B6B6B]">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                    <span>
                      Answer all <strong>{questions.length} questions</strong>
                    </span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                    <span>
                      Passing score: <strong>{passingScore}%</strong>
                    </span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                    <span>
                      Time limit: <strong>{timeLimit} minutes</strong> (not enforced)
                    </span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mr-2"></div>
                    <span>
                      <strong>24-hour cooldown</strong> if you fail
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

          {/* Questions - POLISHED */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question._id} className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6] hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-xl text-[#2C2C2C]">Question {index + 1}</span>
                  {question.difficulty && <span className={`text-xs px-3 py-1 rounded-full font-semibold ${question.difficulty === "easy" ? "bg-green-100 text-green-800" : question.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{question.difficulty.toUpperCase()}</span>}
                </div>

                <p className="text-lg text-[#2C2C2C] mb-6 leading-relaxed">{question.questionText}</p>

                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question._id] === option ? "border-purple-600 bg-purple-50 shadow-sm" : "border-[#E8E8E6] hover:border-purple-300 hover:bg-[#FAFAF8]"}`}>
                      <input type="radio" name={question._id} value={option} checked={answers[question._id] === option} onChange={(e) => handleAnswerChange(question._id, e.target.value)} className="w-5 h-5 text-purple-600 mr-4 cursor-pointer flex-shrink-0" />
                      <span className="text-[#2C2C2C] font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button - POLISHED */}
          <div className="mt-8 flex justify-center">
            <button onClick={handleSubmit} disabled={answeredCount !== questions.length} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-12 py-5 rounded-xl font-bold text-xl hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-3 group">
              <Trophy className="w-7 h-7" />
              <span>Submit Final Exam</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default FinalExamView;
