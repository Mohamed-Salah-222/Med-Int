import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI, courseAPI } from "../services/api";
import { DetailedProgress } from "../types";
import { ArrowLeft, User as UserIcon, Mail, Calendar, Shield, Award, BookOpen, Target, CheckCircle, XCircle, Trash2, RefreshCw, Edit, TrendingUp, ChevronDown, Lock, Clock } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [progress, setProgress] = useState<DetailedProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetProgressModal, setShowResetProgressModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const COURSE_ID = import.meta.env.VITE_COURSE_ID;

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      // Get basic user info
      const userResponse = await adminAPI.getUserById(id!);
      setUser(userResponse.data.user);
      setSelectedRole(userResponse.data.user.role);

      // Get detailed progress (same as dashboard)
      // We need a new admin endpoint that gets progress for a specific user
      const progressResponse = await adminAPI.getUserProgress(id!, COURSE_ID);
      setProgress(progressResponse.data.progress);

      // Auto-expand current chapter
      const currentChapter = progressResponse.data.progress.chapters.find((c: any) => !c.testPassed);
      if (currentChapter) {
        setExpandedChapters(new Set([currentChapter.chapterId]));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleUpdateRole = async () => {
    setActionLoading(true);
    try {
      await adminAPI.updateUserRole(id!, selectedRole);
      setShowRoleModal(false);
      fetchUserDetails();
      alert("Role updated successfully!");
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert(error.response?.data?.message || "Failed to update user role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetProgress = async () => {
    setActionLoading(true);
    try {
      await adminAPI.resetUserProgress(id!);
      setShowResetProgressModal(false);
      fetchUserDetails();
      alert("Progress reset successfully!");
    } catch (error: any) {
      console.error("Error resetting progress:", error);
      alert(error.response?.data?.message || "Failed to reset user progress");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(id!);
      navigate("/admin/users");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "SuperVisor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Student":
        return "bg-[#7A9D96]/10 text-[#7A9D96] border-[#7A9D96]/30";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading user details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-red-600">User not found</div>
        </div>
      </Layout>
    );
  }

  // Calculate totals (same as dashboard)
  const totalLessons = progress ? progress.chapters.reduce((sum, ch) => sum + ch.totalLessons, 0) : 0;
  const completedLessonsCount = progress ? progress.chapters.reduce((sum, ch) => sum + ch.completedLessons, 0) : 0;
  const completedChaptersCount = progress ? progress.chapters.filter((c) => c.testPassed).length : 0;
  const completionPercentage = progress && progress.chapters.length > 0 ? Math.round((completedChaptersCount / progress.chapters.length) * 100) : 0;
  const lessonCompletionPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  return (
    <Layout>
      <div className="bg-[#FAFAF8] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <button onClick={() => navigate("/admin/users")} className="flex items-center text-[#7A9D96] hover:text-[#6A8D86] mb-6 font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Users
          </button>

          {/* User Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E8E6] mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start space-x-4 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">{user.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                    {user.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center border ${getRoleBadge(user.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                    {user.isVerified ? (
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-800 flex items-center border border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-100 text-red-800 flex items-center border border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-[#6B6B6B]">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-[#7A9D96]" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-[#7A9D96]" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRoleModal(true)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="Change Role">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => setShowResetProgressModal(true)} className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all" title="Reset Progress">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={() => setShowDeleteModal(true)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete User">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {progress ? (
            <>
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <BookOpen className="w-8 h-8 text-[#7A9D96]" strokeWidth={1.5} />
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#2C2C2C]">{progress.currentChapter}</div>
                      <div className="text-xs text-[#6B6B6B] mt-1">Current Chapter</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <CheckCircle className="w-8 h-8 text-[#7A9D96]" strokeWidth={1.5} />
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#2C2C2C]">
                        {completedLessonsCount}/{totalLessons}
                      </div>
                      <div className="text-xs text-[#6B6B6B] mt-1">Lessons Complete</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="w-8 h-8 text-[#7A9D96]" strokeWidth={1.5} />
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#2C2C2C]">
                        {completedChaptersCount}/{progress.chapters.length}
                      </div>
                      <div className="text-xs text-[#6B6B6B] mt-1">Chapters Complete</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <Award className="w-8 h-8 text-[#7A9D96]" strokeWidth={1.5} />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#2C2C2C]">{progress.courseCompleted ? "Complete" : "Active"}</div>
                      <div className="text-xs text-[#6B6B6B] mt-1">Course Status</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-[#E8E8E6]">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#2C2C2C]">Lesson Progress</span>
                    <span className="text-sm font-bold text-[#7A9D96]">{lessonCompletionPercentage}%</span>
                  </div>
                  <div className="w-full bg-[#E8E8E6] rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2.5 rounded-full transition-all duration-500" style={{ width: `${lessonCompletionPercentage}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#2C2C2C]">Chapter Progress</span>
                    <span className="text-sm font-bold text-[#7A9D96]">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-[#E8E8E6] rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Certificate Banner */}
              {progress.courseCompleted && progress.certificateIssued && (
                <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
                  <div className="flex items-center space-x-4">
                    <Award className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-1">Course Completed!</h2>
                      <p className="text-base sm:text-lg text-white/90">This user has earned their certificates</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Path */}
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Learning Path
                </h2>

                {progress.chapters.map((chapter) => {
                  const isExpanded = expandedChapters.has(chapter.chapterId);

                  return (
                    <div key={chapter.chapterId} className="bg-white rounded-xl shadow-md border border-[#E8E8E6] overflow-hidden">
                      {/* Chapter Header */}
                      <button onClick={() => toggleChapter(chapter.chapterId)} className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-[#FAFAF8] transition-colors text-left">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${chapter.testPassed ? "bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white" : "bg-[#E8E8E6] text-[#6B6B6B]"}`}>{chapter.chapterNumber}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2C] mb-1 truncate">{chapter.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#6B6B6B]">
                              <span className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                {chapter.completedLessons}/{chapter.totalLessons} lessons
                              </span>
                              {chapter.testPassed && (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Test Passed ({chapter.testScore}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                          {chapter.testPassed && (
                            <div className="hidden sm:flex bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </div>
                          )}
                          <ChevronDown className={`w-6 h-6 text-[#7A9D96] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {/* Lessons */}
                      {isExpanded && (
                        <div className="border-t border-[#E8E8E6] bg-[#FAFAF8] p-4 sm:p-6">
                          <div className="space-y-2 mb-4">
                            {chapter.lessons.map((lesson) => (
                              <div key={lesson.lessonId} className={`flex items-center justify-between p-4 rounded-lg transition-all ${lesson.completed ? "bg-white border border-[#7A9D96]/30" : "bg-gray-100 opacity-60"}`}>
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  {lesson.completed ? (
                                    <div className="w-5 h-5 rounded-full bg-[#7A9D96] flex items-center justify-center flex-shrink-0">
                                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <Clock className="w-5 h-5 text-[#6B6B6B] flex-shrink-0" strokeWidth={2} />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className={`font-semibold text-sm sm:text-base ${lesson.completed ? "text-[#2C2C2C]" : "text-gray-400"}`}>
                                      Lesson {lesson.lessonNumber}: {lesson.title}
                                    </span>
                                    {lesson.completed && lesson.attempts > 0 && (
                                      <div className="text-xs text-[#6B6B6B] mt-0.5">
                                        {lesson.attempts} {lesson.attempts === 1 ? "attempt" : "attempts"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {lesson.completed && <div className="text-sm font-bold text-[#7A9D96] flex-shrink-0 ml-2">{lesson.quizScore}/5</div>}
                              </div>
                            ))}
                          </div>

                          {/* Chapter Test Status */}
                          <div className="pt-4 border-t border-[#E8E8E6]">
                            {chapter.testPassed ? (
                              <div className="w-full py-3 rounded-xl font-semibold bg-green-100 text-green-700 flex items-center justify-center space-x-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>Test Passed ({chapter.testScore}%)</span>
                              </div>
                            ) : chapter.allLessonsCompleted ? (
                              <div className="w-full py-3 rounded-xl font-semibold bg-orange-100 text-orange-700 flex items-center justify-center space-x-2">
                                <Target className="w-5 h-5" />
                                <span>Ready for Test</span>
                              </div>
                            ) : (
                              <div className="w-full py-3 rounded-xl font-semibold bg-gray-100 text-gray-500 flex items-center justify-center space-x-2">
                                <Lock className="w-5 h-5" />
                                <span className="text-sm sm:text-base">
                                  {chapter.completedLessons}/{chapter.totalLessons} lessons completed
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Final Exam Section */}
              <div className="mt-8">
                {progress.finalExam.attempts.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-[#E8E8E6] shadow-sm">
                    <h3 className="text-xl font-bold text-[#2C2C2C] mb-4 flex items-center">
                      <Award className="w-6 h-6 text-[#7A9D96] mr-2" />
                      Final Exam Attempts ({progress.finalExam.attempts.length})
                    </h3>
                    <div className="space-y-3">
                      {progress.finalExam.attempts.map((attempt: any, index: number) => (
                        <div key={index} className="p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6] flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-[#2C2C2C]">Attempt {index + 1}</span>
                            <div className="text-sm text-[#6B6B6B] mt-1">{new Date(attempt.attemptedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-[#2C2C2C]">{attempt.score}%</span>
                            {attempt.passed ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6] shadow-sm">
              <BookOpen className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">No progress data available</p>
              <p className="text-sm text-[#6B6B6B] mt-2">User hasn't started the course yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals remain the same */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Change User Role</h2>
            <p className="text-[#6B6B6B] mb-6">
              Change role for <strong>{user.name}</strong>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Select Role</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                <option value="User">User</option>
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
                <option value="SuperVisor">SuperVisor</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleUpdateRole} disabled={actionLoading} className="flex-1 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {actionLoading ? "Updating..." : "Update Role"}
              </button>
              <button onClick={() => setShowRoleModal(false)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetProgressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Reset User Progress</h2>
            <p className="text-[#6B6B6B] mb-6">
              Are you sure you want to reset all progress for <strong>{user.name}</strong>?
            </p>
            <p className="text-sm text-red-600 font-semibold mb-6">This action cannot be undone!</p>
            <div className="flex items-center space-x-4">
              <button onClick={handleResetProgress} disabled={actionLoading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50">
                {actionLoading ? "Resetting..." : "Reset Progress"}
              </button>
              <button onClick={() => setShowResetProgressModal(false)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Delete User</h2>
            <p className="text-[#6B6B6B] mb-6">
              Permanently delete <strong>{user.name}</strong>?
            </p>
            <p className="text-sm text-red-600 font-semibold mb-6">This action cannot be undone!</p>
            <div className="flex items-center space-x-4">
              <button onClick={handleDeleteUser} disabled={actionLoading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50">
                {actionLoading ? "Deleting..." : "Delete User"}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-3 border-2 border-[#E8E8E6] text-[#6B6B6B] rounded-lg font-semibold hover:border-[#7A9D96] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminUserDetail;
