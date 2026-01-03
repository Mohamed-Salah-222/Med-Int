import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Plus, Edit, Trash2, Eye, EyeOff, Layers, BookOpen, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  courseId: {
    _id: string;
    title: string;
  };
  title: string;
  description: string;
  chapterNumber: number;
  lessonsCount: number;
  testQuestionsCount: number;
  isPublished: boolean;
  createdAt: string;
}

function AdminChapters() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);

  // Form state
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
    fetchChapters();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse);
    } else {
      fetchChapters();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await adminAPI.getAllCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchChapters = async (courseId?: string) => {
    try {
      const response = await adminAPI.getAllChapters(courseId);
      setChapters(response.data.chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      await adminAPI.createChapter({ courseId, title, description, chapterNumber });
      setShowCreateModal(false);
      resetForm();
      fetchChapters(selectedCourse);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create chapter");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;

    setError("");
    setFormLoading(true);

    try {
      await adminAPI.updateChapter(editingChapter.id, { title, description, chapterNumber });
      setEditingChapter(null);
      resetForm();
      fetchChapters(selectedCourse);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update chapter");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingChapter) return;

    try {
      await adminAPI.deleteChapter(deletingChapter.id);
      setDeletingChapter(null);
      fetchChapters(selectedCourse);
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Failed to delete chapter");
    }
  };

  const handleTogglePublish = async (chapter: Chapter) => {
    try {
      await adminAPI.updateChapter(chapter.id, { isPublished: !chapter.isPublished });
      fetchChapters(selectedCourse);
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Failed to update chapter status");
    }
  };

  const openEditModal = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setTitle(chapter.title);
    setDescription(chapter.description);
    setChapterNumber(chapter.chapterNumber);
  };

  const resetForm = () => {
    setCourseId("");
    setTitle("");
    setDescription("");
    setChapterNumber(1);
    setError("");
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingChapter(null);
    setDeletingChapter(null);
    resetForm();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading chapters...</div>
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
                Chapters
              </h1>
              <p className="text-[#6B6B6B]">Organize course content into chapters</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Chapter</span>
            </button>
          </div>

          {/* Course Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Filter by Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Chapters List */}
          {chapters.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <Layers className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">{selectedCourse ? "No chapters in this course yet." : "No chapters yet. Create your first chapter!"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-[#7A9D96] text-white text-sm font-bold px-3 py-1 rounded-lg">Chapter {chapter.chapterNumber}</span>
                        <h3 className="text-2xl font-bold text-[#2C2C2C]">{chapter.title}</h3>
                        {chapter.isPublished ? (
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-semibold">Draft</span>
                        )}
                      </div>
                      <p className="text-sm text-[#7A9D96] mb-2 flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {chapter.courseId.title}
                      </p>
                      <p className="text-[#6B6B6B] mb-4">{chapter.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-[#6B6B6B]">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1 text-[#7A9D96]" />
                          <span>{chapter.lessonsCount} lessons</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1 text-[#7A9D96]" />
                          <span>{chapter.testQuestionsCount} test questions</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Publish Toggle */}
                      <button onClick={() => handleTogglePublish(chapter)} className={`p-2 rounded-lg transition-all ${chapter.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} title={chapter.isPublished ? "Unpublish" : "Publish"}>
                        {chapter.isPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      {/* Edit */}
                      <button onClick={() => openEditModal(chapter)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      <button onClick={() => setDeletingChapter(chapter)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
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
      {(showCreateModal || editingChapter) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6">{editingChapter ? "Edit Chapter" : "Create New Chapter"}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={editingChapter ? handleUpdate : handleCreate} className="space-y-4">
              {/* Course Selection (only for create) */}
              {!editingChapter && (
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Course *</label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required>
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Chapter Number *</label>
                <input type="number" value={chapterNumber} onChange={(e) => setChapterNumber(parseInt(e.target.value))} min="1" max="100" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Chapter Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" placeholder="Introduction to Medical Interpretation" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none resize-none" placeholder="This chapter covers the fundamentals..." required />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button type="submit" disabled={formLoading} className="flex-1 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {formLoading ? "Saving..." : editingChapter ? "Update Chapter" : "Create Chapter"}
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
      {deletingChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Delete Chapter</h2>
            <p className="text-[#6B6B6B] mb-6">
              Are you sure you want to delete{" "}
              <strong>
                Chapter {deletingChapter.chapterNumber}: {deletingChapter.title}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-4">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all">
                Delete
              </button>
              <button onClick={() => setDeletingChapter(null)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminChapters;
