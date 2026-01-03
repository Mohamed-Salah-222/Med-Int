import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Plus, Edit, Trash2, HelpCircle, AlertCircle, Volume2, Filter, Link, CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: "quiz" | "test" | "exam";
  hasExplanation: boolean;
  hasAudio: boolean;
  createdAt: string;
  assignedTo?: {
    type: "lesson" | "chapter" | "course";
    id: string;
    title: string;
  };
}

function AdminQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningQuestion, setAssigningQuestion] = useState<Question | null>(null);
  const [assignTargetType, setAssignTargetType] = useState<"lesson" | "chapter" | "course">("lesson");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [type, setType] = useState<"quiz" | "test" | "exam">("quiz");
  const [explanation, setExplanation] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetchQuestions(selectedType);
  }, [selectedType]);

  useEffect(() => {
    if (showAssignModal) {
      fetchCourses();
    }
  }, [showAssignModal]);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse);
      setSelectedChapter("");
      setSelectedLesson("");
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedChapter) {
      fetchLessons(selectedChapter);
      setSelectedLesson("");
    }
  }, [selectedChapter]);

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

  const fetchCourses = async () => {
    try {
      const response = await adminAPI.getAllCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchChapters = async (courseId: string) => {
    try {
      const response = await adminAPI.getAllChapters(courseId);
      setChapters(response.data.chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const fetchLessons = async (chapterId: string) => {
    try {
      const response = await adminAPI.getAllLessons(chapterId);
      setLessons(response.data.lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (options.some((opt) => !opt.trim())) {
      setError("All 4 options must be filled");
      return;
    }

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

    if (options.some((opt) => !opt.trim())) {
      setError("All 4 options must be filled");
      return;
    }

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
    } catch (error) {
      console.error("Error fetching question details:", error);
      alert("Failed to load question details");
    }
  };

  const openAssignModal = (question: Question) => {
    setAssigningQuestion(question);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assigningQuestion) return;

    let targetId = "";
    if (assignTargetType === "lesson") {
      targetId = selectedLesson;
    } else if (assignTargetType === "chapter") {
      targetId = selectedChapter;
    } else if (assignTargetType === "course") {
      targetId = selectedCourse;
    }

    if (!targetId) {
      setError("Please select a target to assign this question to");
      return;
    }

    setAssignLoading(true);
    try {
      await adminAPI.assignQuestions({
        targetId,
        targetType: assignTargetType,
        questionIds: [assigningQuestion.id],
      });
      setShowAssignModal(false);
      setAssigningQuestion(null);
      resetAssignForm();
      fetchQuestions(selectedType);
      alert("Question assigned successfully!");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to assign question");
    } finally {
      setAssignLoading(false);
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
    setError("");
  };

  const resetAssignForm = () => {
    setAssignTargetType("lesson");
    setSelectedCourse("");
    setSelectedChapter("");
    setSelectedLesson("");
    setCourses([]);
    setChapters([]);
    setLessons([]);
    setError("");
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingQuestion(null);
    setDeletingQuestion(null);
    resetForm();
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case "quiz":
        return "Quiz";
      case "test":
        return "Test";
      case "exam":
        return "Exam";
      default:
        return t;
    }
  };

  // Filter questions based on type and assignment status
  const filteredQuestions = questions.filter((q) => {
    if (showUnassignedOnly && q.assignedTo) return false;
    return true;
  });

  const unassignedCount = questions.filter((q) => !q.assignedTo).length;

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
      <div className="bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                Questions Bank
              </h1>
              <p className="text-[#6B6B6B]">Manage and assign questions to lessons, tests, and exams</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Question</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{questions.length}</div>
              <div className="text-sm text-[#6B6B6B]">Total Questions</div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="text-3xl font-bold text-[#7A9D96] mb-1">{questions.filter((q) => q.assignedTo).length}</div>
              <div className="text-sm text-[#6B6B6B]">Assigned</div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="text-3xl font-bold text-[#E87461] mb-1">{unassignedCount}</div>
              <div className="text-sm text-[#6B6B6B]">Unassigned</div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{questions.filter((q) => q.hasAudio).length}</div>
              <div className="text-sm text-[#6B6B6B]">With Audio</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Filter by Type
                </label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                  <option value="">All Types</option>
                  <option value="quiz">Quiz Questions</option>
                  <option value="test">Test Questions</option>
                  <option value="exam">Exam Questions</option>
                </select>
              </div>

              {/* Assignment Status Toggle */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Assignment Status</label>
                <div className="flex items-center h-[52px]">
                  <button onClick={() => setShowUnassignedOnly(!showUnassignedOnly)} className={`flex items-center space-x-3 px-6 py-3 rounded-lg border-2 font-semibold transition-all ${showUnassignedOnly ? "border-[#E87461] bg-[#E87461]/10 text-[#E87461]" : "border-[#E8E8E6] text-[#6B6B6B] hover:border-[#7A9D96]"}`}>
                    {showUnassignedOnly ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <span>Show Unassigned Only ({unassignedCount})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#E8E8E6]">
              <HelpCircle className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">{showUnassignedOnly ? "No unassigned questions found." : selectedType ? `No ${selectedType} questions yet.` : "No questions yet. Create your first question!"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div key={question.id} className={`bg-white rounded-xl p-6 border-2 transition-all ${question.assignedTo ? "border-[#7A9D96] shadow-sm" : "border-[#E8E8E6] hover:border-[#7A9D96]"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header with badges */}
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#2C2C2C]/10 text-[#2C2C2C] border border-[#2C2C2C]/10">{getTypeLabel(question.type)}</span>

                        {question.hasAudio && (
                          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#7A9D96]/10 text-[#7A9D96] border border-[#7A9D96]/20 flex items-center">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Audio
                          </span>
                        )}

                        {question.hasExplanation && <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#7A9D96]/10 text-[#7A9D96] border border-[#7A9D96]/20">Explanation</span>}
                      </div>

                      {/* Question Text */}
                      <p className="text-lg font-semibold text-[#2C2C2C] mb-4">{question.questionText}</p>

                      {/* Options Grid */}
                      <div className="grid md:grid-cols-2 gap-2 mb-4">
                        {question.options.map((option, index) => (
                          <div key={index} className={`text-sm p-3 rounded-lg border transition-all ${option === question.correctAnswer ? "bg-[#7A9D96]/10 border-[#7A9D96] text-[#2C2C2C] font-semibold" : "bg-[#FAFAF8] border-[#E8E8E6] text-[#6B6B6B]"}`}>
                            <span className="font-bold text-[#2C2C2C]">{String.fromCharCode(65 + index)}.</span> {option}
                          </div>
                        ))}
                      </div>

                      {/* Assignment Status */}
                      {question.assignedTo ? (
                        <div className="flex items-center space-x-2 p-3 bg-[#7A9D96]/10 border border-[#7A9D96]/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-[#7A9D96]" />
                          <span className="text-sm font-semibold text-[#7A9D96]">Assigned to {question.assignedTo.type === "lesson" ? "Lesson" : question.assignedTo.type === "chapter" ? "Chapter Test" : "Final Exam"}:</span>
                          <span className="text-sm text-[#2C2C2C]">{question.assignedTo.title}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-[#E87461]/10 border border-[#E87461]/30 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-[#E87461]" />
                          <span className="text-sm font-semibold text-[#E87461]">Not assigned yet</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <button onClick={() => openAssignModal(question)} className="p-2 bg-[#7A9D96]/10 text-[#7A9D96] rounded-lg hover:bg-[#7A9D96]/20 transition-all border border-[#7A9D96]/20" title="Assign Question">
                        <Link className="w-5 h-5" />
                      </button>

                      <button onClick={() => openEditModal(question)} className="p-2 bg-[#2C2C2C]/10 text-[#2C2C2C] rounded-lg hover:bg-[#2C2C2C]/10 transition-all border border-[#2C2C2C]/10" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>

                      <button onClick={() => setDeletingQuestion(question)} className="p-2 bg-[#E87461]/10 text-[#E87461] rounded-lg hover:bg-[#E87461]/30 transition-all border border-[#E87461]/30" title="Delete">
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
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
              {editingQuestion ? "Edit Question" : "Create New Question"}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={editingQuestion ? handleUpdate : handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Question Type *</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                  <option value="quiz">Quiz (Lesson)</option>
                  <option value="test">Test (Chapter)</option>
                  <option value="exam">Exam (Final)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Question Text *</label>
                <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none resize-none" placeholder="What is the primary role of a medical interpreter?" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Options (4 required) *</label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#2C2C2C]/10 rounded-lg flex items-center justify-center font-bold text-[#2C2C2C] border border-[#2C2C2C]/10">{String.fromCharCode(65 + index)}</div>
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
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Delete Question
            </h2>
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

      {/* Assign Question Modal */}
      {showAssignModal && assigningQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Assign Question
            </h2>
            <p className="text-[#6B6B6B] mb-6">
              Assign "<strong>{assigningQuestion.questionText}</strong>" to a lesson, chapter test, or final exam.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Target Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Assign To</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setAssignTargetType("lesson")} className={`p-3 rounded-lg border-2 font-semibold transition-all ${assignTargetType === "lesson" ? "border-[#7A9D96] bg-[#7A9D96]/10 text-[#7A9D96]" : "border-[#E8E8E6] text-[#6B6B6B] hover:border-[#7A9D96]"}`}>
                    Lesson Quiz
                  </button>
                  <button type="button" onClick={() => setAssignTargetType("chapter")} className={`p-3 rounded-lg border-2 font-semibold transition-all ${assignTargetType === "chapter" ? "border-[#7A9D96] bg-[#7A9D96]/10 text-[#7A9D96]" : "border-[#E8E8E6] text-[#6B6B6B] hover:border-[#7A9D96]"}`}>
                    Chapter Test
                  </button>
                  <button type="button" onClick={() => setAssignTargetType("course")} className={`p-3 rounded-lg border-2 font-semibold transition-all ${assignTargetType === "course" ? "border-[#7A9D96] bg-[#7A9D96]/10 text-[#7A9D96]" : "border-[#E8E8E6] text-[#6B6B6B] hover:border-[#7A9D96]"}`}>
                    Final Exam
                  </button>
                </div>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Select Course</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Selection (only for lesson or chapter type) */}
              {(assignTargetType === "lesson" || assignTargetType === "chapter") && (
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Select Chapter</label>
                  <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" disabled={!selectedCourse}>
                    <option value="">{!selectedCourse ? "Select a course first" : "Select a chapter"}</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        Chapter {chapter.chapterNumber}: {chapter.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lesson Selection (only for lesson type) */}
              {assignTargetType === "lesson" && (
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Select Lesson</label>
                  <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" disabled={!selectedChapter}>
                    <option value="">{!selectedChapter ? "Select a chapter first" : "Select a lesson"}</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        Lesson {lesson.lessonNumber}: {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button onClick={handleAssign} disabled={assignLoading} className="flex-1 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {assignLoading ? "Assigning..." : "Assign Question"}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningQuestion(null);
                  resetAssignForm();
                }}
                className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all"
              >
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
