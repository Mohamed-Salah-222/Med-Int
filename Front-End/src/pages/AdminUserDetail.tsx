import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { ArrowLeft, User as UserIcon, Mail, Calendar, Shield, Award, BookOpen, Target, Clock, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw, Edit } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Progress {
  currentChapter: number;
  currentLesson: number;
  completionPercentage: number;
  courseCompleted: boolean;
  completedAt?: string;
  certificateIssued: boolean;
  certificateIssuedAt?: string;
  completedLessons: Array<{
    lessonId: {
      _id: string;
      title: string;
      lessonNumber: number;
    };
    completedAt: string;
    quizScore: number;
    attempts: number;
    passed: boolean;
  }>;
  chapterTestAttempts: Array<{
    chapterId: {
      _id: string;
      title: string;
      chapterNumber: number;
    };
    attemptedAt: string;
    score: number;
    passed: boolean;
  }>;
  chapterTestCooldowns: Array<{
    chapterId: string;
    lastAttemptAt: string;
  }>;
  finalExamAttempts: Array<{
    attemptedAt: string;
    score: number;
    passed: boolean;
  }>;
  finalExamCooldown?: {
    lastAttemptAt: string;
  };
}

function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetProgressModal, setShowResetProgressModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const response = await adminAPI.getUserById(id!);
      setUser(response.data.user);
      setProgress(response.data.progress);
      setSelectedRole(response.data.user.role);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    setActionLoading(true);
    try {
      await adminAPI.updateUserRole(id!, selectedRole);
      setShowRoleModal(false);
      fetchUserDetails();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTestCooldown = async (chapterId: string) => {
    if (!confirm("Reset test cooldown for this chapter?")) return;

    try {
      await adminAPI.resetTestCooldown(id!, chapterId);
      fetchUserDetails();
      alert("Test cooldown reset successfully");
    } catch (error) {
      console.error("Error resetting test cooldown:", error);
      alert("Failed to reset test cooldown");
    }
  };

  const handleResetExamCooldown = async () => {
    if (!confirm("Reset exam cooldown? User will be able to retake immediately.")) return;

    try {
      await adminAPI.resetExamCooldown(id!);
      fetchUserDetails();
      alert("Exam cooldown reset successfully");
    } catch (error) {
      console.error("Error resetting exam cooldown:", error);
      alert("Failed to reset exam cooldown");
    }
  };

  const handleResetProgress = async () => {
    setActionLoading(true);
    try {
      await adminAPI.resetUserProgress(id!);
      setShowResetProgressModal(false);
      fetchUserDetails();
    } catch (error) {
      console.error("Error resetting progress:", error);
      alert("Failed to reset user progress");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(id!);
      navigate("/admin/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading user details...</div>
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-800";
      case "SuperVisor":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Back Button */}
          <button onClick={() => navigate("/admin/users")} className="flex items-center text-[#7A9D96] hover:text-[#6A8D86] mb-6 font-semibold">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Users
          </button>

          {/* User Header */}
          <div className="bg-white rounded-2xl p-8 border-2 border-[#E8E8E6] mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center text-white text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
                    {user.name}
                  </h1>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center ${getRoleBadge(user.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                    {user.isVerified ? (
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-800 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-100 text-red-800 flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-[#6B6B6B]">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-[#7A9D96]" />
                      {user.email}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-[#7A9D96]" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
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

            {/* Progress Overview */}
            {progress && (
              <div className="mt-6 pt-6 border-t border-[#E8E8E6]">
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-[#2C2C2C]">{progress.completionPercentage}%</div>
                    <div className="text-sm text-[#6B6B6B]">Course Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#2C2C2C]">
                      Ch {progress.currentChapter}, L {progress.currentLesson}
                    </div>
                    <div className="text-sm text-[#6B6B6B]">Current Position</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#2C2C2C]">{progress.completedLessons.length}</div>
                    <div className="text-sm text-[#6B6B6B]">Lessons Completed</div>
                  </div>
                  <div>
                    {progress.courseCompleted ? (
                      <>
                        <div className="text-2xl font-bold text-green-600 flex items-center">
                          <CheckCircle className="w-6 h-6 mr-2" />
                          Complete
                        </div>
                        <div className="text-sm text-[#6B6B6B]">{progress.completedAt && new Date(progress.completedAt).toLocaleDateString()}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-orange-600">In Progress</div>
                        <div className="text-sm text-[#6B6B6B]">Not completed</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-3 rounded-full transition-all" style={{ width: `${progress.completionPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {progress ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Completed Lessons */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-5 h-5 text-[#7A9D96] mr-2" />
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Completed Lessons ({progress.completedLessons.length})</h2>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {progress.completedLessons.length === 0 ? (
                    <p className="text-[#6B6B6B] text-center py-8">No lessons completed yet</p>
                  ) : (
                    progress.completedLessons.map((lesson, index) => (
                      <div key={index} className="p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[#2C2C2C]">
                            Lesson {lesson.lessonId.lessonNumber}: {lesson.lessonId.title}
                          </span>
                          {lesson.passed ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <div className="flex items-center justify-between text-sm text-[#6B6B6B]">
                          <span>
                            Score: <strong className="text-[#2C2C2C]">{lesson.quizScore}%</strong>
                          </span>
                          <span>
                            Attempts: <strong className="text-[#2C2C2C]">{lesson.attempts}</strong>
                          </span>
                          <span>{new Date(lesson.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chapter Tests */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                <div className="flex items-center mb-4">
                  <Target className="w-5 h-5 text-[#7A9D96] mr-2" />
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Chapter Tests ({progress.chapterTestAttempts.length})</h2>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {progress.chapterTestAttempts.length === 0 ? (
                    <p className="text-[#6B6B6B] text-center py-8">No chapter tests attempted yet</p>
                  ) : (
                    progress.chapterTestAttempts.map((test, index) => {
                      const cooldown = progress.chapterTestCooldowns.find((c) => c.chapterId === test.chapterId._id);
                      return (
                        <div key={index} className="p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[#2C2C2C]">
                              Chapter {test.chapterId.chapterNumber}: {test.chapterId.title}
                            </span>
                            {test.passed ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          </div>
                          <div className="flex items-center justify-between text-sm text-[#6B6B6B] mb-2">
                            <span>
                              Score: <strong className="text-[#2C2C2C]">{test.score}%</strong>
                            </span>
                            <span>{new Date(test.attemptedAt).toLocaleDateString()}</span>
                          </div>
                          {cooldown && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8E8E6]">
                              <span className="text-xs text-orange-600 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Cooldown active
                              </span>
                              <button onClick={() => handleResetTestCooldown(test.chapterId._id)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                Reset Cooldown
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Final Exam */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                <div className="flex items-center mb-4">
                  <Award className="w-5 h-5 text-[#7A9D96] mr-2" />
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Final Exam ({progress.finalExamAttempts.length})</h2>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {progress.finalExamAttempts.length === 0 ? (
                    <p className="text-[#6B6B6B] text-center py-8">No exam attempts yet</p>
                  ) : (
                    <>
                      {progress.finalExamAttempts.map((exam, index) => (
                        <div key={index} className="p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[#2C2C2C]">Attempt {index + 1}</span>
                            {exam.passed ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          </div>
                          <div className="flex items-center justify-between text-sm text-[#6B6B6B]">
                            <span>
                              Score: <strong className="text-[#2C2C2C]">{exam.score}%</strong>
                            </span>
                            <span>{new Date(exam.attemptedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {progress.finalExamCooldown && (
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-orange-800 flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              Exam cooldown active (24 hours)
                            </span>
                            <button onClick={handleResetExamCooldown} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                              Reset Cooldown
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Certificate */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                <div className="flex items-center mb-4">
                  <Award className="w-5 h-5 text-[#7A9D96] mr-2" />
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Certificate</h2>
                </div>
                {progress.certificateIssued ? (
                  <div className="p-6 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] rounded-lg text-white text-center">
                    <Award className="w-16 h-16 mx-auto mb-4" />
                    <div className="text-xl font-bold mb-2">Certificate Issued</div>
                    <div className="text-sm opacity-90">{progress.certificateIssuedAt && new Date(progress.certificateIssuedAt).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#6B6B6B]">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[#E8E8E6]" />
                    <p>No certificate issued yet</p>
                    <p className="text-sm mt-2">User must complete the course and pass the final exam</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <AlertCircle className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">No progress data available</p>
              <p className="text-sm text-[#6B6B6B] mt-2">User hasn't started the course yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Change Role Modal */}
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

      {/* Reset Progress Modal */}
      {showResetProgressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Reset User Progress</h2>
            <p className="text-[#6B6B6B] mb-6">
              Are you sure you want to reset all progress for <strong>{user.name}</strong>? This will delete:
            </p>
            <ul className="text-sm text-[#6B6B6B] mb-6 space-y-2">
              <li>• All completed lessons</li>
              <li>• All chapter test attempts</li>
              <li>• All exam attempts</li>
              <li>• Certificate (if issued)</li>
              <li>• All cooldowns</li>
            </ul>
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

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">Delete User</h2>
            <p className="text-[#6B6B6B] mb-6">
              Are you sure you want to permanently delete <strong>{user.name}</strong>? This will delete:
            </p>
            <ul className="text-sm text-[#6B6B6B] mb-6 space-y-2">
              <li>• User account</li>
              <li>• All progress data</li>
              <li>• All certificates</li>
            </ul>
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
