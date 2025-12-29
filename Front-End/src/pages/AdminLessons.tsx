import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, BookOpen, Layers, AlertCircle, CheckCircle, Code } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
}

interface Lesson {
  id: string;
  chapterId: {
    _id: string;
    title: string;
    chapterNumber: number;
  };
  title: string;
  lessonNumber: number;
  contentType: string;
  quizQuestionsCount: number;
  isPublished: boolean;
  createdAt: string;
}

function AdminLessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  // Modal-specific state (separate from page filters)
  const [modalSelectedCourse, setModalSelectedCourse] = useState<string>("");
  const [modalChapters, setModalChapters] = useState<Chapter[]>([]);

  // Form state
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [lessonNumber, setLessonNumber] = useState(1);
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"text" | "audio-exercise">("text");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
    fetchLessons();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse);
    } else {
      setChapters([]);
      setSelectedChapter("");
    }
  }, [selectedCourse]);

  useEffect(() => {
    console.log("selectedChapter changed to:", selectedChapter);
    if (selectedChapter) {
      console.log("Fetching lessons for chapter:", selectedChapter);
      fetchLessons(selectedChapter);
    } else if (selectedCourse) {
      console.log("Fetching all lessons for course");
      fetchLessons();
    } else {
      console.log("Fetching all lessons");
      fetchLessons();
    }
  }, [selectedChapter]);

  // Fetch chapters for modal when course is selected in modal
  useEffect(() => {
    if (modalSelectedCourse) {
      fetchModalChapters(modalSelectedCourse);
    } else {
      setModalChapters([]);
      setChapterId("");
    }
  }, [modalSelectedCourse]);

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

  const fetchModalChapters = async (courseId: string) => {
    try {
      const response = await adminAPI.getAllChapters(courseId);
      setModalChapters(response.data.chapters);
    } catch (error) {
      console.error("Error fetching modal chapters:", error);
    }
  };

  const fetchLessons = async (chapterId?: string) => {
    try {
      const response = await adminAPI.getAllLessons(chapterId);
      setLessons(response.data.lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      await adminAPI.createLesson({
        chapterId,
        title,
        lessonNumber,
        content,
        contentType,
      });
      setShowCreateModal(false);
      resetForm();
      fetchLessons(selectedChapter);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create lesson");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    setError("");
    setFormLoading(true);

    try {
      await adminAPI.updateLesson(editingLesson.id, {
        title,
        lessonNumber,
        content,
        contentType,
      });
      setEditingLesson(null);
      resetForm();
      fetchLessons(selectedChapter);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update lesson");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLesson) return;

    try {
      await adminAPI.deleteLesson(deletingLesson.id);
      setDeletingLesson(null);
      fetchLessons(selectedChapter);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Failed to delete lesson");
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      await adminAPI.updateLesson(lesson.id, { isPublished: !lesson.isPublished });
      fetchLessons(selectedChapter);
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Failed to update lesson status");
    }
  };

  const openEditModal = async (lesson: Lesson) => {
    try {
      const response = await adminAPI.getLessonById(lesson.id);
      const fullLesson = response.data.lesson;

      setEditingLesson(lesson);
      setTitle(fullLesson.title);
      setLessonNumber(fullLesson.lessonNumber);
      setContent(fullLesson.content);
      setContentType(fullLesson.contentType);
    } catch (error) {
      console.error("Error fetching lesson details:", error);
      alert("Failed to load lesson details");
    }
  };

  const resetForm = () => {
    setChapterId("");
    setTitle("");
    setLessonNumber(1);
    setContent("");
    setContentType("text");
    setModalSelectedCourse("");
    setModalChapters([]);
    setError("");
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingLesson(null);
    setDeletingLesson(null);
    resetForm();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading lessons...</div>
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
              <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                Lessons
              </h1>
              <p className="text-[#6B6B6B]">Create and manage lesson content</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Lesson</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Filter by Course</label>
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Filter by Chapter</label>
              <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" disabled={!selectedCourse}>
                <option value="">All Chapters</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lessons List */}
          {lessons.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <FileText className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">{selectedChapter ? "No lessons in this chapter yet." : "No lessons yet. Create your first lesson!"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-[#7A9D96] text-white text-sm font-bold px-3 py-1 rounded-lg">Lesson {lesson.lessonNumber}</span>
                        <h3 className="text-2xl font-bold text-[#2C2C2C]">{lesson.title}</h3>
                        {lesson.isPublished ? (
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-semibold">Draft</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-[#7A9D96] mb-2">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          Chapter {lesson.chapterId.chapterNumber}: {lesson.chapterId.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-[#6B6B6B]">
                        <div className="flex items-center">
                          <Code className="w-4 h-4 mr-1 text-[#7A9D96]" />
                          <span>{lesson.contentType}</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1 text-[#7A9D96]" />
                          <span>{lesson.quizQuestionsCount} quiz questions</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Publish Toggle */}
                      <button onClick={() => handleTogglePublish(lesson)} className={`p-2 rounded-lg transition-all ${lesson.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} title={lesson.isPublished ? "Unpublish" : "Publish"}>
                        {lesson.isPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      {/* Edit */}
                      <button onClick={() => openEditModal(lesson)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      <button onClick={() => setDeletingLesson(lesson)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
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
      {(showCreateModal || editingLesson) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8">
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6">{editingLesson ? "Edit Lesson" : "Create New Lesson"}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={editingLesson ? handleUpdate : handleCreate} className="space-y-4">
              {/* Chapter Selection (only for create) */}
              {!editingLesson && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Select Course First</label>
                    <select
                      value={modalSelectedCourse}
                      onChange={(e) => {
                        setModalSelectedCourse(e.target.value);
                        setChapterId("");
                      }}
                      className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Chapter *</label>
                    <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" required disabled={!modalSelectedCourse}>
                      <option value="">{!modalSelectedCourse ? "Select a course first" : modalChapters.length === 0 ? "Loading chapters..." : "Select a chapter"}</option>
                      {modalChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          Chapter {chapter.chapterNumber}: {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Lesson Number *</label>
                  <input type="number" value={lessonNumber} onChange={(e) => setLessonNumber(parseInt(e.target.value))} min="1" max="100" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Content Type *</label>
                  <select value={contentType} onChange={(e) => setContentType(e.target.value as "text" | "audio-exercise")} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                    <option value="text">Text</option>
                    <option value="audio-exercise">Audio Exercise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Lesson Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" placeholder="What Is Interpretation?" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Content (HTML) *</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none resize-none font-mono text-sm" placeholder="<h2>Section Title</h2><p>Content here...</p>" required />
                <p className="text-xs text-[#6B6B6B] mt-1">Use HTML tags for formatting</p>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button type="submit" disabled={formLoading} className="flex-1 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {formLoading ? "Saving..." : editingLesson ? "Update Lesson" : "Create Lesson"}
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
      {deletingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Delete Lesson</h2>
            <p className="text-[#6B6B6B] mb-6">
              Are you sure you want to delete{" "}
              <strong>
                Lesson {deletingLesson.lessonNumber}: {deletingLesson.title}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-4">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all">
                Delete
              </button>
              <button onClick={() => setDeletingLesson(null)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminLessons;
