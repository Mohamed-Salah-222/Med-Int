import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Plus, Edit, Trash2, HelpCircle, AlertCircle, Volume2, Filter } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: "quiz" | "test" | "exam";
  difficulty?: "easy" | "medium" | "hard";
  hasExplanation: boolean;
  hasAudio: boolean;
  createdAt: string;
}

function AdminQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [type, setType] = useState<"quiz" | "test" | "exam">("quiz");
  const [explanation, setExplanation] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetchQuestions(selectedType);
  }, [selectedType]);

  const fetchQuestions = async (type?: string) => {
    try {
      const response = await adminAPI.getAllQuestions(type);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate options
    if (options.some((opt) => !opt.trim())) {
      setError("All 4 options must be filled");
      return;
    }

    // Validate correct answer
    if (!options.includes(correctAnswer)) {
      setError("Correct answer must be one of the options");
      return;
    }

    setFormLoading(true);

    try {
      await adminAPI.createQuestion({
        questionText,
        options: options.filter((opt) => opt.trim()),
        correctAnswer,
        type,
        explanation: explanation || undefined,
        audioUrl: audioUrl || undefined,
        difficulty,
      });
      setShowCreateModal(false);
      resetForm();
      fetchQuestions(selectedType);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create question");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setError("");

    // Validate options
    if (options.some((opt) => !opt.trim())) {
      setError("All 4 options must be filled");
      return;
    }

    // Validate correct answer
    if (!options.includes(correctAnswer)) {
      setError("Correct answer must be one of the options");
      return;
    }

    setFormLoading(true);

    try {
      await adminAPI.updateQuestion(editingQuestion.id, {
        questionText,
        options: options.filter((opt) => opt.trim()),
        correctAnswer,
        type,
        explanation: explanation || undefined,
        audioUrl: audioUrl || undefined,
        difficulty,
      });
      setEditingQuestion(null);
      resetForm();
      fetchQuestions(selectedType);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update question");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;

    try {
      await adminAPI.deleteQuestion(deletingQuestion.id);
      setDeletingQuestion(null);
      fetchQuestions(selectedType);
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question");
    }
  };

  const openEditModal = async (question: Question) => {
    try {
      const response = await adminAPI.getQuestionById(question.id);
      const fullQuestion = response.data.question;

      setEditingQuestion(question);
      setQuestionText(fullQuestion.questionText);
      setOptions(fullQuestion.options);
      setCorrectAnswer(fullQuestion.correctAnswer);
      setType(fullQuestion.type);
      setExplanation(fullQuestion.explanation || "");
      setAudioUrl(fullQuestion.audioUrl || "");
      setDifficulty(fullQuestion.difficulty || "easy");
    } catch (error) {
      console.error("Error fetching question details:", error);
      alert("Failed to load question details");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setType("quiz");
    setExplanation("");
    setAudioUrl("");
    setDifficulty("easy");
    setError("");
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingQuestion(null);
    setDeletingQuestion(null);
    resetForm();
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case "quiz":
        return "bg-blue-100 text-blue-800";
      case "test":
        return "bg-purple-100 text-purple-800";
      case "exam":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading questions...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                Questions
              </h1>
              <p className="text-[#6B6B6B]">Manage quiz, test, and exam questions</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Question</span>
            </button>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-2 text-[#7A9D96]" />
              Filter by Type
            </label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
              <option value="">All Types</option>
              <option value="quiz">Quiz (5 questions per lesson)</option>
              <option value="test">Test (20 questions per chapter)</option>
              <option value="exam">Exam (100 questions for final)</option>
            </select>
          </div>

          {/* Questions Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-[#E8E8E6]">
              <div className="text-2xl font-bold text-[#2C2C2C]">{questions.length}</div>
              <div className="text-sm text-[#6B6B6B]">Total Questions</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">{questions.filter((q) => q.type === "quiz").length}</div>
              <div className="text-sm text-blue-600">Quiz Questions</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-800">{questions.filter((q) => q.type === "test").length}</div>
              <div className="text-sm text-purple-600">Test Questions</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="text-2xl font-bold text-orange-800">{questions.filter((q) => q.type === "exam").length}</div>
              <div className="text-sm text-orange-600">Exam Questions</div>
            </div>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <HelpCircle className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">{selectedType ? `No ${selectedType} questions yet.` : "No questions yet. Create your first question!"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getTypeColor(question.type)}`}>{question.type.toUpperCase()}</span>
                        {question.difficulty && <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getDifficultyColor(question.difficulty)}`}>{question.difficulty.toUpperCase()}</span>}
                        {question.hasAudio && (
                          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-800 flex items-center">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Audio
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-[#2C2C2C] mb-3">{question.questionText}</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {question.options.map((option, index) => (
                          <div key={index} className={`text-sm p-2 rounded-lg border ${option === question.correctAnswer ? "bg-green-50 border-green-200 text-green-800 font-semibold" : "bg-gray-50 border-gray-200 text-[#6B6B6B]"}`}>
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                      {question.hasExplanation && (
                        <div className="mt-3 text-xs text-[#7A9D96] flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Has explanation
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button onClick={() => openEditModal(question)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>

                      <button onClick={() => setDeletingQuestion(question)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingQuestion) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8">
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6">{editingQuestion ? "Edit Question" : "Create New Question"}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={editingQuestion ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Question Type *</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                    <option value="quiz">Quiz (Lesson)</option>
                    <option value="test">Test (Chapter)</option>
                    <option value="exam">Exam (Final)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Question Text *</label>
                <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none resize-none" placeholder="What is the primary role of a medical interpreter?" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Options (4 required) *</label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-[#2C2C2C] w-6">{String.fromCharCode(65 + index)}.</span>
                      <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="flex-1 px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" placeholder={`Option ${String.fromCharCode(65 + index)}`} required />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Correct Answer *</label>
                <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required>
                  <option value="">Select the correct answer</option>
                  {options
                    .filter((opt) => opt.trim())
                    .map((option, index) => (
                      <option key={index} value={option}>
                        {String.fromCharCode(65 + index)}. {option}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Explanation (Optional)</label>
                <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none resize-none" placeholder="Explain why this is the correct answer..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Audio URL (Optional)</label>
                <input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" placeholder="https://example.com/audio.mp3" />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button type="submit" disabled={formLoading} className="flex-1 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {formLoading ? "Saving..." : editingQuestion ? "Update Question" : "Create Question"}
                </button>
                <button type="button" onClick={closeModals} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Delete Question</h2>
            <p className="text-[#6B6B6B] mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <p className="text-sm text-[#2C2C2C] font-semibold">{deletingQuestion.questionText}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all">
                Delete
              </button>
              <button onClick={() => setDeletingQuestion(null)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminQuestions;
