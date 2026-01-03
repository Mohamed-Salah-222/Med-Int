import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Users as UsersIcon, Search, Filter, ChevronLeft, ChevronRight, Eye, Shield, User, CheckCircle, XCircle, Award, Trash2, UserPlus, TrendingUp, FileText, Calendar } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface Statistics {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalChapters: number;
    totalLessons: number;
    totalQuestions: number;
    completedCourses: number;
    certificatesIssued: number;
  };
  recentActivity: {
    newUsers: number;
    quizAttempts: number;
    testAttempts: number;
    examAttempts: number;
  };
}

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await adminAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
      });

      // Simple frontend filter for verification
      let filteredUsers = response.data.users;

      if (verificationFilter) {
        filteredUsers = filteredUsers.filter((u: User) => (verificationFilter === "verified" ? u.isVerified : !u.isVerified));
      }

      setUsers(filteredUsers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePromoteToStudent = async (userId: string, userName: string) => {
    if (!confirm(`Promote ${userName} to Student role?`)) return;

    try {
      await adminAPI.updateUserRole(userId, "Student");
      alert(`${userName} has been promoted to Student!`);
      fetchUsers();
      fetchStatistics();
    } catch (error: any) {
      console.error("Error promoting user:", error);
      alert(error.response?.data?.message || "Failed to promote user");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`DELETE ${userName}'s account permanently? This CANNOT be undone!`)) return;
    if (!confirm(`Are you ABSOLUTELY SURE? This will delete all their data forever.`)) return;

    try {
      await adminAPI.deleteUser(userId);
      alert(`${userName}'s account has been deleted`);
      fetchUsers();
      fetchStatistics();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
      case "SuperVisor":
        return <Shield className="w-3 h-3 mr-1" />;
      default:
        return <User className="w-3 h-3 mr-1" />;
    }
  };

  if (loading || statsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Users Management
            </h1>
            <p className="text-[#6B6B6B]">Monitor and manage all platform users</p>
          </div>

          {/* Statistics Cards - WARM PROFESSIONAL */}
          {statistics && (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                  <UsersIcon className="w-6 h-6 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-[#2C2C2C]">{statistics.overview.totalUsers}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">Total Users</div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                  <UserPlus className="w-6 h-6 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-[#2C2C2C]">{users.filter((u) => u.role === "Student").length}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">Students</div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                  <CheckCircle className="w-6 h-6 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-[#2C2C2C]">{statistics.overview.completedCourses}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">Completed</div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                  <Award className="w-6 h-6 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-[#2C2C2C]">{statistics.overview.certificatesIssued}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">Certificates</div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                  <TrendingUp className="w-6 h-6 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-[#2C2C2C]">{statistics.recentActivity.newUsers}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">New (30 days)</div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                  <FileText className="w-6 h-6 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <div className="text-3xl font-bold text-[#2C2C2C]">{statistics.recentActivity.quizAttempts + statistics.recentActivity.testAttempts}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">Activity (30 days)</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#E8E8E6] mb-6 shadow-sm">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Search className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Search Users
                </label>
                <div className="flex space-x-2">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyPress={handleKeyPress} placeholder="Search by name or email..." className="flex-1 px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all" />
                  <button onClick={handleSearch} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                    Search
                  </button>
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all"
                >
                  <option value="">All Roles</option>
                  <option value="User">Users</option>
                  <option value="Student">Students</option>
                  <option value="Admin">Admins</option>
                  <option value="SuperVisor">Supervisors</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Verification
                </label>
                <select
                  value={verificationFilter}
                  onChange={(e) => {
                    setVerificationFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all"
                >
                  <option value="">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users List - SIMPLIFIED */}
          {users.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6] shadow-sm">
              <UsersIcon className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-xl p-4 sm:p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all shadow-sm hover:shadow-md">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2C] truncate">{user.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center border ${getRoleBadge(user.role)}`}>
                          {getRoleIcon(user.role)}
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
                            Unverified
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[#6B6B6B] mb-2 truncate">{user.email}</p>

                      <div className="flex items-center gap-x-4 text-xs text-[#6B6B6B]">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap lg:flex-col gap-2 lg:ml-4">
                      <button onClick={() => navigate(`/admin/users/${user.id}`)} className="flex-1 lg:flex-none px-4 py-2 bg-[#7A9D96] text-white rounded-lg hover:bg-[#6A8D86] transition-all flex items-center justify-center space-x-2 font-semibold text-sm shadow-sm" title="View Details">
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>

                      {user.role === "User" && (
                        <button onClick={() => handlePromoteToStudent(user.id, user.name)} className="flex-1 lg:flex-none px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center space-x-2 font-semibold text-sm" title="Promote to Student">
                          <UserPlus className="w-4 h-4" />
                          <span>Promote</span>
                        </button>
                      )}

                      <button onClick={() => handleDeleteUser(user.id, user.name)} className="flex-1 lg:flex-none px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center space-x-2 font-semibold text-sm" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-[#6B6B6B]">
                Showing {(page - 1) * pagination.limit + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 border-2 border-[#E8E8E6] rounded-lg hover:border-[#7A9D96] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#E8E8E6]">
                  <ChevronLeft className="w-5 h-5 text-[#2C2C2C]" />
                </button>
                <span className="text-sm font-semibold text-[#2C2C2C] px-4">
                  Page {page} of {pagination.pages}
                </span>
                <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="p-2 border-2 border-[#E8E8E6] rounded-lg hover:border-[#7A9D96] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#E8E8E6]">
                  <ChevronRight className="w-5 h-5 text-[#2C2C2C]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminUsers;
