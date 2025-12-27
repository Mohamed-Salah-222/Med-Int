import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer, QuizSubmitResponse } from "../types";
import { CheckCircle, XCircle, Clock, Target, ArrowLeft, Trophy, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import Layout from "../components/Layout";

function QuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passingScore, setPassingScore] = useState(80);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async () => {
    const allAnswered = questions.every((q) => answers[q._id]);

    if (!allAnswered) {
      alert("Please answer all questions before submitting.");
      return;
    }

    if (!confirm("Are you sure you want to submit your quiz?")) {
      return;
    }

    const formattedAnswers: QuizAnswer[] = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id],
    }));

    try {
      const response = await courseAPI.submitQuiz(id!, formattedAnswers);
      setResults(response.data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading quiz...</div>
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
            <div className={`rounded-2xl shadow-xl p-12 mb-8 ${results.passed ? "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500" : "bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500"}`}>
              <div className="text-center">
                {results.passed ? <Trophy className="w-20 h-20 text-green-600 mx-auto mb-6" strokeWidth={1.5} /> : <BookOpen className="w-20 h-20 text-orange-600 mx-auto mb-6" strokeWidth={1.5} />}
                <h1 className="text-4xl font-bold mb-4 text-[#2C2C2C]" style={{ fontFamily: "Playfair Display, serif" }}>
                  {results.passed ? "Great Job!" : "Keep Practicing!"}
                </h1>
                <div className="text-6xl font-bold mb-4 text-[#2C2C2C]">{results.score}%</div>
                <p className="text-xl text-[#6B6B6B] mb-2">
                  You answered {results.correctCount} out of {results.totalQuestions} questions correctly
                </p>
                {results.passed ? <p className="text-lg text-green-700 font-semibold">You passed! Great job understanding the material.</p> : <p className="text-lg text-orange-700 font-semibold">You need {passingScore}% to pass. Review the material and try again.</p>}
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

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {!results.passed && (
                <button onClick={() => window.location.reload()} className="bg-[#7A9D96] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all shadow-md flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Retry Quiz</span>
                </button>
              )}
              <button onClick={() => navigate("/dashboard")} className="bg-white border-2 border-[#E8E8E6] text-[#2C2C2C] px-8 py-3 rounded-lg font-semibold hover:border-[#7A9D96] hover:text-[#7A9D96] transition-all flex items-center space-x-2">
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                  Lesson Quiz
                </h1>
                <p className="text-[#6B6B6B]">Test your understanding of the material</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#7A9D96]">
                  {answeredCount}/{questions.length}
                </div>
                <div className="text-sm text-[#6B6B6B]">Questions Answered</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E8E8E6] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          {/* Quiz Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-[#2C2C2C] mb-3">Quiz Instructions:</p>
                <ul className="space-y-2 text-[#6B6B6B]">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    Answer all {questions.length} questions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    You need {passingScore}% to pass
                  </li>
                  <li className="flex items-center">
                    <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
                    You can retry unlimited times
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
                    <label key={optIndex} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question._id] === option ? "border-[#7A9D96] bg-[#7A9D96]/5 shadow-sm" : "border-[#E8E8E6] hover:border-[#7A9D96]/50 hover:bg-[#FAFAF8]"}`}>
                      <input type="radio" name={question._id} value={option} checked={answers[question._id] === option} onChange={(e) => handleAnswerChange(question._id, e.target.value)} className="w-5 h-5 text-[#7A9D96] mr-4 cursor-pointer" />
                      <span className="text-[#2C2C2C] font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button onClick={handleSubmit} disabled={answeredCount !== questions.length} className="bg-[#7A9D96] text-white px-12 py-4 rounded-lg font-bold text-lg hover:bg-[#6A8D86] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none flex items-center space-x-2">
              <Target className="w-6 h-6" />
              <span>Submit Quiz</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default QuizView;
