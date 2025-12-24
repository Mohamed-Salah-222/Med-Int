import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Question, QuizAnswer } from "../types";

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
  const { id } = useParams(); // chapter ID
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(20);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<TestSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await courseAPI.getChapterTest(id!);
        setQuestions(response.data.test.questions);
        setPassingScore(response.data.test.passingScore);
        setTimeLimit(response.data.test.timeLimit);
      } catch (error: any) {
        console.error("Error fetching test:", error);
        if (error.response?.status === 403) {
          setError(error.response.data.message || "You cannot take this test yet");
        } else {
          setError("Failed to load test");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
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

    if (!confirm("Are you sure you want to submit your chapter test? You can only retake after 3 hours.")) {
      return;
    }

    const formattedAnswers: QuizAnswer[] = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id],
    }));

    try {
      const response = await courseAPI.submitChapterTest(id!, formattedAnswers);
      setResults(response.data);
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting test:", error);
      if (error.response?.status === 403) {
        alert(error.response.data.message || "Test is on cooldown");
      } else {
        alert("Failed to submit test. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading chapter test...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <button onClick={() => navigate("/dashboard")} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted && results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Chapter Test Results</h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Results Summary */}
          <div className={`rounded-lg shadow-lg p-8 mb-8 ${results.passed ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"}`}>
            <div className="text-center">
              <div className="text-6xl mb-4">{results.passed ? "🎉" : "📚"}</div>
              <h2 className="text-3xl font-bold mb-2">{results.passed ? "Chapter Test Passed!" : "Not Passed Yet"}</h2>
              <p className="text-xl mb-4">
                You scored {results.score}% ({results.correctCount} out of {results.totalQuestions})
              </p>
              <p className="text-lg">{results.passed ? "Great work! You can now proceed to the next chapter." : `You need ${passingScore}% to pass. You can retry after 3 hours.`}</p>
            </div>
          </div>

          {/* Question Results */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6">Answer Review</h3>
            <div className="space-y-6">
              {results.results.map((result, index) => (
                <div key={result.questionId} className={`p-4 rounded-lg ${result.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-start mb-2">
                    <span className="font-bold mr-2">Q{index + 1}.</span>
                    <span>{result.questionText}</span>
                  </div>

                  <div className="ml-6 space-y-2">
                    <div className={`font-medium ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>Your answer: {result.selectedAnswer}</div>
                    {!result.isCorrect && <div className="font-medium text-green-700">Correct answer: {result.correctAnswer}</div>}
                    {result.explanation && <div className="text-gray-600 text-sm mt-2">💡 {result.explanation}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button onClick={() => navigate("/dashboard")} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Chapter Test</h1>
          <div className="text-gray-600">
            {Object.keys(answers).length} / {questions.length} answered
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Test Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-8">
          <p className="font-semibold">Chapter Test Instructions:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Answer all {questions.length} questions</li>
            <li>You need {passingScore}% to pass</li>
            <li>Time limit: {timeLimit} minutes (not enforced yet)</li>
            <li>⏰ You can only retry after 3 hours cooldown</li>
          </ul>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question._id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-4">
                <span className="font-bold text-lg">Question {index + 1}</span>
                {question.difficulty && <span className={`ml-3 text-sm px-2 py-1 rounded ${question.difficulty === "easy" ? "bg-green-100 text-green-800" : question.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{question.difficulty}</span>}
              </div>

              <p className="text-lg mb-4">{question.questionText}</p>

              <div className="space-y-3">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${answers[question._id] === option ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name={question._id} value={option} checked={answers[question._id] === option} onChange={(e) => handleAnswerChange(question._id, e.target.value)} className="mr-3" />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length} className="bg-blue-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            Submit Chapter Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChapterTestView;
