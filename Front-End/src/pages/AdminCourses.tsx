import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Layers, AlertCircle, CheckCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  totalChapters: number;
  chaptersCount: number;
  isPublished: boolean;
  finalExamQuestionsCount: number;
  createdAt: string;
}

function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeleteingCourse] = useState<Course | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalChapters, setTotalChapters] = useState(10);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await adminAPI.getAllCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      await adminAPI.createCourse({ title, description, totalChapters });
      setShowCreateModal(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setError("");
    setFormLoading(true);

    try {
      await adminAPI.updateCourse(editingCourse.id, { title, description, totalChapters });
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update course");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;

    try {
      await adminAPI.deleteCourse(deletingCourse.id);
      setDeleteingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      await adminAPI.updateCourse(course.id, { isPublished: !course.isPublished });
      fetchCourses();
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Failed to update course status");
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setTotalChapters(course.totalChapters);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTotalChapters(10);
    setError("");
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingCourse(null);
    setDeleteingCourse(null);
    resetForm();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading courses...</div>
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
                Courses
              </h1>
              <p className="text-[#6B6B6B]">Manage all courses in the platform</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Course</span>
            </button>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <BookOpen className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">No courses yet. Create your first course!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-bold text-[#2C2C2C]">{course.title}</h3>
                        {course.isPublished ? (
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-semibold">Draft</span>
                        )}
                      </div>
                      <p className="text-[#6B6B6B] mb-4">{course.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-[#6B6B6B]">
                        <div className="flex items-center">
                          <Layers className="w-4 h-4 mr-1 text-[#7A9D96]" />
                          <span>
                            {course.chaptersCount} / {course.totalChapters} chapters
                          </span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1 text-[#7A9D96]" />
                          <span>{course.finalExamQuestionsCount} exam questions</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Publish Toggle */}
                      <button onClick={() => handleTogglePublish(course)} className={`p-2 rounded-lg transition-all ${course.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} title={course.isPublished ? "Unpublish" : "Publish"}>
                        {course.isPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      {/* Edit */}
                      <button onClick={() => openEditModal(course)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      <button onClick={() => setDeleteingCourse(course)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
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
      {(showCreateModal || editingCourse) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6">{editingCourse ? "Edit Course" : "Create New Course"}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={editingCourse ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Course Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" placeholder="Medical Interpreter Certification" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none resize-none" placeholder="Complete professional medical interpreter training..." required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Total Chapters</label>
                <input type="number" value={totalChapters} onChange={(e) => setTotalChapters(parseInt(e.target.value))} min="1" max="50" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button type="submit" disabled={formLoading} className="flex-1 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {formLoading ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
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
      {deletingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Delete Course</h2>
            <p className="text-[#6B6B6B] mb-6">
              Are you sure you want to delete <strong>{deletingCourse.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-4">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all">
                Delete
              </button>
              <button onClick={() => setDeleteingCourse(null)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminCourses;
