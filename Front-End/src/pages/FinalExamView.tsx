import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer } from "../types";
import { AlertTriangle, CheckCircle, XCircle, Clock, Award, ArrowLeft, Trophy, Shield, AlertCircle } from "lucide-react";
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
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      if (error.response?.status === 403) {
        alert(error.response.data.message || "Exam is on cooldown");
      } else {
        alert("Failed to submit exam. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading final exam...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <AlertTriangle className="w-24 h-24 text-red-600 mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">{error}</h2>
            <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">Please complete all chapter tests before taking the final exam.</p>
            <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all shadow-md">
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
        <div className="min-h-screen bg-[#FAFAF8] py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Results Summary */}
            <div className={`rounded-2xl shadow-2xl p-12 mb-8 ${results.passed ? "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500" : "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500"}`}>
              <div className="text-center">
                {results.passed ? <Trophy className="w-24 h-24 text-green-600 mx-auto mb-6" strokeWidth={1.5} /> : <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6" strokeWidth={1.5} />}
                <h1 className="text-5xl font-bold mb-4 text-[#2C2C2C]" style={{ fontFamily: "Playfair Display, serif" }}>
                  {results.passed ? "Congratulations!" : "Keep Trying!"}
                </h1>
                <div className="text-7xl font-bold mb-4 text-[#2C2C2C]">{results.score}%</div>
                <p className="text-xl text-[#6B6B6B] mb-2">
                  You answered {results.correctCount} out of {results.totalQuestions} questions correctly
                </p>
                {results.passed ? <p className="text-lg text-green-700 font-semibold mb-8">🎉 You have completed the course and earned your certificates!</p> : <p className="text-lg text-red-700 font-semibold">You need {passingScore}% to pass. You can retry after 24 hours.</p>}

                {/* Certificates Preview */}
                {results.passed && results.certificates && (
                  <div className="bg-white rounded-xl p-8 mt-8 shadow-lg">
                    <h3 className="text-3xl font-bold text-[#2C2C2C] mb-6 flex items-center justify-center">
                      <Award className="w-8 h-8 text-[#7A9D96] mr-3" />
                      Your Certificates
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Main Certificate Preview */}
                      <div className="border-2 border-[#7A9D96] rounded-xl p-6 bg-[#7A9D96]/5">
                        <Shield className="w-12 h-12 text-[#7A9D96] mx-auto mb-4" />
                        <h4 className="font-bold text-xl mb-3 text-[#2C2C2C]">Medical Interpreter</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-[#6B6B6B]">
                            Certificate #: <span className="font-mono text-[#2C2C2C] font-semibold">{results.certificates.main.certificateNumber}</span>
                          </p>
                          <p className="text-[#6B6B6B]">
                            Verification: <span className="font-mono text-[#2C2C2C] font-semibold">{results.certificates.main.verificationCode}</span>
                          </p>
                        </div>
                      </div>

                      {/* HIPAA Certificate Preview */}
                      <div className="border-2 border-[#2C2C2C] rounded-xl p-6 bg-[#2C2C2C]/5">
                        <Shield className="w-12 h-12 text-[#2C2C2C] mx-auto mb-4" />
                        <h4 className="font-bold text-xl mb-3 text-[#2C2C2C]">HIPAA Compliance</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-[#6B6B6B]">
                            Certificate #: <span className="font-mono text-[#2C2C2C] font-semibold">{results.certificates.hipaa.certificateNumber}</span>
                          </p>
                          <p className="text-[#6B6B6B]">
                            Verification: <span className="font-mono text-[#2C2C2C] font-semibold">{results.certificates.hipaa.verificationCode}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Certificates have been sent to your email
                      </p>
                    </div>

                    <button onClick={() => navigate(`/certificate/${id}`)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all flex items-center mx-auto space-x-2">
                      <Award className="w-6 h-6" />
                      <span>View Full Certificates</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Question Results */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center">
                <Award className="w-6 h-6 text-[#7A9D96] mr-3" />
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

            {/* Action Button */}
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

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-2xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                  Final Exam
                </h1>
                <p className="text-xl text-purple-100">Your last step to certification</p>
              </div>
              <Trophy className="w-20 h-20 text-purple-200" strokeWidth={1.5} />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {answeredCount}/{questions.length}
              </div>
              <div className="text-lg text-purple-100">Questions Answered</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-purple-900/30 rounded-full h-3 mt-4">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-3 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-7 h-7 text-red-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-xl text-[#2C2C2C] mb-3">⚠️ FINAL EXAM - READ CAREFULLY</p>
                <ul className="space-y-2 text-[#6B6B6B]">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                    Answer all {questions.length} questions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                    You need {passingScore}% to pass
                  </li>
                  <li className="flex items-center">
                    <Clock className="w-4 h-4 text-red-600 mr-2" />
                    Time limit: {timeLimit} minutes (not enforced yet)
                  </li>
                  <li className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    <strong>You can only retry after 24 HOURS cooldown</strong>
                  </li>
                  <li className="flex items-center">
                    <Award className="w-4 h-4 text-red-600 mr-2" />
                    Passing earns you TWO certificates (Main + HIPAA)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question._id} className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-xl text-[#2C2C2C]">Question {index + 1}</span>
                  {question.difficulty && <span className={`text-xs px-3 py-1 rounded-full font-semibold ${question.difficulty === "easy" ? "bg-green-100 text-green-800" : question.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{question.difficulty.toUpperCase()}</span>}
                </div>

                <p className="text-lg text-[#2C2C2C] mb-6">{question.questionText}</p>

                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question._id] === option ? "border-purple-600 bg-purple-50 shadow-sm" : "border-[#E8E8E6] hover:border-purple-300 hover:bg-[#FAFAF8]"}`}>
                      <input type="radio" name={question._id} value={option} checked={answers[question._id] === option} onChange={(e) => handleAnswerChange(question._id, e.target.value)} className="w-5 h-5 text-purple-600 mr-4 cursor-pointer" />
                      <span className="text-[#2C2C2C] font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button onClick={handleSubmit} disabled={answeredCount !== questions.length} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-12 py-5 rounded-lg font-bold text-xl hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-3">
              <Award className="w-7 h-7" />
              <span>Submit Final Exam</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default FinalExamView;
