import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Users as UsersIcon, Search, Filter, ChevronLeft, ChevronRight, Eye, Shield, User, CheckCircle, XCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  completionPercentage: number;
  courseCompleted: boolean;
  certificateIssued: boolean;
}

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
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

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(response.data.users);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-3 h-3 mr-1" />;
      case "SuperVisor":
        return <Shield className="w-3 h-3 mr-1" />;
      default:
        return <User className="w-3 h-3 mr-1" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading users...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Users Management
            </h1>
            <p className="text-[#6B6B6B]">View and manage all platform users</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Search className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Search Users
                </label>
                <div className="flex space-x-2">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyPress={handleKeyPress} placeholder="Search by name or email..." className="flex-1 px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" />
                  <button onClick={handleSearch} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                    Search
                  </button>
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="Student">Students</option>
                  <option value="Admin">Admins</option>
                  <option value="SuperVisor">Supervisors</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl p-4 border border-[#E8E8E6]">
              <div className="text-2xl font-bold text-[#2C2C2C]">{pagination.total}</div>
              <div className="text-sm text-[#6B6B6B]">Total Users</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">{users.filter((u) => u.role === "Student").length}</div>
              <div className="text-sm text-blue-600">Students</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-800">{users.filter((u) => u.courseCompleted).length}</div>
              <div className="text-sm text-green-600">Completed Course</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-800">{users.filter((u) => u.certificateIssued).length}</div>
              <div className="text-sm text-purple-600">Certificates Issued</div>
            </div>
          </div>

          {/* Users List */}
          {users.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <UsersIcon className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-[#2C2C2C]">{user.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center ${getRoleBadge(user.role)}`}>
                          {getRoleIcon(user.role)}
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
                      <p className="text-sm text-[#6B6B6B] mb-3">{user.email}</p>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#6B6B6B]">Course Progress</span>
                          <span className="text-xs font-bold text-[#2C2C2C]">{user.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all" style={{ width: `${user.completionPercentage}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-3 text-xs text-[#6B6B6B]">
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        {user.courseCompleted && <span className="text-green-600 font-semibold">✓ Course Completed</span>}
                        {user.certificateIssued && <span className="text-purple-600 font-semibold">✓ Certificate Issued</span>}
                      </div>
                    </div>

                    {/* View Details Button */}
                    <div className="ml-4">
                      <button onClick={() => navigate(`/admin/users/${user.id}`)} className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center space-x-2" title="View Details">
                        <Eye className="w-5 h-5" />
                        <span className="text-sm font-semibold">View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-[#6B6B6B]">
                Showing {(page - 1) * pagination.limit + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 border-2 border-[#E8E8E6] rounded-lg hover:border-[#7A9D96] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5 text-[#2C2C2C]" />
                </button>
                <span className="text-sm font-semibold text-[#2C2C2C]">
                  Page {page} of {pagination.pages}
                </span>
                <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="p-2 border-2 border-[#E8E8E6] rounded-lg hover:border-[#7A9D96] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
