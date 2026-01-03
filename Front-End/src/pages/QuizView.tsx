import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer, QuizSubmitResponse } from "../types";
import { CheckCircle, XCircle, Target, ArrowLeft, Trophy, BookOpen, AlertCircle, RefreshCw, X, AlertTriangle } from "lucide-react";
import Layout from "../components/Layout";

// Extended response type to include nextLessonId
interface ExtendedQuizSubmitResponse extends QuizSubmitResponse {
  nextLessonId?: string | null;
}

function QuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passingScore, setPassingScore] = useState(80);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ExtendedQuizSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await courseAPI.getLessonQuiz(id!);
        setQuestions(response.data.quiz.questions);
        setPassingScore(response.data.quiz.passingScore);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmitClick = () => {
    const allAnswered = questions.every((q) => answers[q._id]);

    if (!allAnswered) {
      setShowIncompleteModal(true);
      return;
    }

    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    const formattedAnswers: QuizAnswer[] = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id],
    }));

    try {
      const response = await courseAPI.submitQuiz(id!, formattedAnswers);
      setResults(response.data);
      setSubmitted(true);
      setShowSubmitModal(false);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading quiz...</p>
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
            {/* Results Summary - WARM & ELEGANT */}
            <div className={`rounded-2xl shadow-lg p-8 mb-8 relative overflow-hidden border-2 ${results.passed ? "bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/5 border-[#7A9D96]" : "bg-gradient-to-br from-[#E76F51]/10 to-orange-100/50 border-[#E76F51]"}`}>
              {/* Subtle decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>

              <div className="text-center relative z-10">
                {/* Small Icon Badge */}
                <div className="mb-4 inline-block">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${results.passed ? "bg-gradient-to-br from-[#7A9D96] to-[#6A8D86]" : "bg-gradient-to-br from-[#E76F51] to-orange-500"}`}>{results.passed ? <Trophy className="w-8 h-8 text-white" strokeWidth={2} /> : <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />}</div>
                </div>

                <h1 className="text-3xl font-bold mb-3 text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  {results.passed ? "Quiz Passed" : "Keep Practicing"}
                </h1>

                {/* Score Display - Cleaner */}
                <div className="mb-4">
                  <div className="text-6xl font-bold text-[#2C2C2C] mb-2">{results.score}%</div>
                  <p className="text-lg text-[#6B6B6B]">
                    {results.correctCount} out of {results.totalQuestions} correct
                  </p>
                </div>

                {results.passed ? <p className="text-base text-[#7A9D96] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">Great job understanding the material!</p> : <p className="text-base text-[#E76F51] font-semibold bg-white/80 inline-block px-6 py-2 rounded-full">Pass score: {passingScore}% • Review and try again</p>}
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

            {/* Action Buttons - ALIGNED WITH CONTENT */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 max-w-4xl mx-auto">
              {results.passed ? (
                <>
                  <button onClick={() => navigate("/dashboard")} className="bg-white border-2 border-[#E8E8E6] text-[#2C2C2C] px-8 py-3 rounded-xl font-semibold text-base hover:border-[#7A9D96] hover:text-[#7A9D96] hover:shadow-md transition-all flex items-center justify-center space-x-2 group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                  </button>

                  {results.nextLessonId ? (
                    <button onClick={() => navigate(`/lesson/${results.nextLessonId}`)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold text-base hover:shadow-lg transition-all flex items-center justify-center space-x-2 group">
                      <span>Continue to Next Lesson</span>
                      <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold text-base hover:shadow-lg transition-all flex items-center justify-center space-x-2 group">
                      <CheckCircle className="w-5 h-5" />
                      <span>Course Complete!</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/dashboard")} className="bg-white border-2 border-[#E8E8E6] text-[#2C2C2C] px-8 py-3 rounded-xl font-semibold text-base hover:border-[#7A9D96] hover:text-[#7A9D96] hover:shadow-md transition-all flex items-center justify-center space-x-2 group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                  </button>

                  <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold text-base hover:shadow-lg transition-all flex items-center justify-center space-x-2 group">
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Retry Quiz</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;
  const unansweredQuestions = questions.filter((q) => !answers[q._id]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header - POLISHED */}
          <div className="bg-gradient-to-r from-white to-[#FAFAF8] rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Lesson Quiz
                </h1>
                <p className="text-[#6B6B6B] text-lg">Test your understanding of the material</p>
              </div>
              <div className="text-center bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white rounded-xl p-4 min-w-[120px]">
                <div className="text-4xl font-bold">
                  {answeredCount}/{questions.length}
                </div>
                <div className="text-sm font-medium opacity-90">Answered</div>
              </div>
            </div>

            {/* Progress Bar - ENHANCED */}
            <div className="relative">
              <div className="w-full bg-[#E8E8E6] rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-[#7A9D96] via-[#6A8D86] to-[#7A9D96] h-3 rounded-full transition-all duration-500 relative" style={{ width: `${progressPercentage}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                </div>
              </div>
              <div className="text-right mt-2">
                <span className="text-sm font-semibold text-[#7A9D96]">{Math.round(progressPercentage)}% Complete</span>
              </div>
            </div>
          </div>

          {/* Quiz Instructions - POLISHED */}
          <div className="bg-gradient-to-r from-[#E76F51]/10 to-[#E76F51]/5 border-l-4 border-[#E76F51] rounded-xl p-6 mb-8 shadow-md">
            <div className="flex items-start">
              <div className="bg-[#E76F51] rounded-lg p-2 mr-4">
                <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#2C2C2C] text-lg mb-3">Quiz Instructions</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-[#E76F51] rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-[#2C2C2C] font-medium">{questions.length} Questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-[#E76F51] rounded-full p-1">
                      <Target className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-[#2C2C2C] font-medium">{passingScore}% to Pass</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-[#E76F51] rounded-full p-1">
                      <RefreshCw className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-[#2C2C2C] font-medium">Unlimited Retries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions - POLISHED */}
          <div className="space-y-6">
            {questions.map((question, index) => {
              const isAnswered = !!answers[question._id];
              return (
                <div key={question._id} className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all ${isAnswered ? "border-[#7A9D96]" : "border-[#E8E8E6]"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${isAnswered ? "bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white" : "bg-[#E8E8E6] text-[#6B6B6B]"}`}>{index + 1}</div>
                      <span className="font-bold text-xl text-[#2C2C2C]">Question {index + 1}</span>
                    </div>
                    {isAnswered && (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>ANSWERED</span>
                      </div>
                    )}
                  </div>

                  <p className="text-lg text-[#2C2C2C] mb-6 leading-relaxed">{question.questionText}</p>

                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => {
                      const isSelected = answers[question._id] === option;
                      return (
                        <label key={optIndex} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-[#7A9D96] bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/5 shadow-md scale-[1.02]" : "border-[#E8E8E6] hover:border-[#7A9D96]/50 hover:bg-[#FAFAF8] hover:shadow-sm"}`}>
                          <div className="relative flex items-center justify-center mr-4">
                            <input type="radio" name={question._id} value={option} checked={isSelected} onChange={(e) => handleAnswerChange(question._id, e.target.value)} className="w-5 h-5 text-[#7A9D96] cursor-pointer" />
                          </div>
                          <span className={`flex-1 font-medium ${isSelected ? "text-[#7A9D96]" : "text-[#2C2C2C]"}`}>{option}</span>
                          {isSelected && <CheckCircle className="w-5 h-5 text-[#7A9D96]" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button - POLISHED */}
          <div className="mt-10 flex justify-center">
            <button onClick={handleSubmitClick} disabled={answeredCount === 0} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-16 py-5 rounded-xl font-bold text-xl hover:shadow-2xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all disabled:shadow-none flex items-center space-x-3 group disabled:from-gray-400 disabled:to-gray-400">
              <Target className="w-7 h-7 group-hover:scale-125 transition-transform" />
              <span>Submit Quiz</span>
              <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                Submit Quiz?
              </h2>
              <p className="text-[#6B6B6B]">You've answered all {questions.length} questions. Ready to see your results?</p>
            </div>

            <div className="bg-[#FAFAF8] rounded-xl p-4 mb-6 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B]">Total Questions:</span>
                <span className="font-bold text-[#2C2C2C]">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Passing Score:</span>
                <span className="font-bold text-[#2C2C2C]">{passingScore}%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} disabled={submitting} className="flex-1 px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-xl font-semibold hover:border-[#2C2C2C] hover:text-[#2C2C2C] transition-all disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleConfirmSubmit} disabled={submitting} className="flex-1 px-6 py-3 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Modal */}
      {showIncompleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                Quiz Incomplete
              </h2>
              <p className="text-[#6B6B6B] mb-4">Please answer all questions before submitting.</p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                <p className="font-semibold text-red-900 mb-2">Unanswered Questions:</p>
                <div className="flex flex-wrap gap-2">
                  {unansweredQuestions.map((q) => (
                    <span key={q._id} className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                      Q{questions.indexOf(q) + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setShowIncompleteModal(false)} className="w-full px-6 py-3 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-xl font-bold hover:shadow-xl transition-all">
              Got it!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Layout>
  );
}

export default QuizView;
