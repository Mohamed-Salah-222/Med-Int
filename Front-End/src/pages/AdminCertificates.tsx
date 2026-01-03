import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Award, Search, Calendar, User, Mail, FileText, Download, ExternalLink, Filter, TrendingUp } from "lucide-react";

interface Certificate {
  _id: string;
  certificateNumber: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  finalExamScore: number;
  completionDate: string;
  issuedAt: string;
}

function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "score">("newest");

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    filterAndSortCertificates();
  }, [certificates, search, sortBy]);

  const fetchCertificates = async () => {
    try {
      const response = await adminAPI.getAllCertificates();
      setCertificates(response.data.certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCertificates = () => {
    let filtered = [...certificates];

    // Filter by search
    if (search) {
      filtered = filtered.filter((cert) => cert.userName.toLowerCase().includes(search.toLowerCase()) || cert.userEmail.toLowerCase().includes(search.toLowerCase()) || cert.certificateNumber.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
        case "oldest":
          return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
        case "score":
          return b.finalExamScore - a.finalExamScore;
        default:
          return 0;
      }
    });

    setFilteredCertificates(filtered);
  };

  const handleVerifyCertificate = (certNumber: string) => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/verify-certificate?code=${certNumber}`, "_blank");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading certificates...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[#FAFAF8] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Certificates
            </h1>
            <p className="text-[#6B6B6B]">View and manage all issued certificates</p>
          </div>

          {/* Stats - WARM THEME */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                <Award className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{certificates.length}</div>
              <div className="text-sm text-[#6B6B6B]">Total Certificates</div>
            </div>

            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-5 sm:p-6 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-white/10 rounded-lg p-2 w-fit mb-3">
                <Award className="w-6 h-6" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold mb-1">{certificates.filter((c) => new Date(c.issuedAt).getMonth() === new Date().getMonth()).length}</div>
              <div className="text-sm opacity-90">Issued This Month</div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                <TrendingUp className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{certificates.length > 0 ? Math.round(certificates.reduce((sum, c) => sum + c.finalExamScore, 0) / certificates.length) : 0}%</div>
              <div className="text-sm text-[#6B6B6B]">Average Score</div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit mb-3">
                <Award className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{certificates.filter((c) => c.finalExamScore >= 90).length}</div>
              <div className="text-sm text-[#6B6B6B]">High Achievers</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#E8E8E6] mb-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Search className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Search Certificates
                </label>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or number..." className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all" />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Sort By
                </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score">Highest Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Certificates List */}
          {filteredCertificates.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6] shadow-sm">
              <Award className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">{search ? "No certificates found matching your search" : "No certificates issued yet"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((cert) => (
                <div key={cert._id} className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all shadow-sm hover:shadow-md">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{cert.userName.charAt(0).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2C] truncate">{cert.userName}</h3>
                          <div className="flex items-center text-sm text-[#6B6B6B] truncate">
                            <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                            {cert.userEmail}
                          </div>
                        </div>
                      </div>

                      {/* Certificate Details */}
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                            <FileText className="w-4 h-4 text-[#7A9D96]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-[#6B6B6B]">Certificate Number</div>
                            <div className="font-mono font-semibold text-[#2C2C2C] text-sm truncate">{cert.certificateNumber}</div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                            <Award className="w-4 h-4 text-[#7A9D96]" />
                          </div>
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Final Exam Score</div>
                            <div className="font-semibold text-[#2C2C2C] flex items-center flex-wrap gap-2">
                              {cert.finalExamScore}%{cert.finalExamScore >= 90 && <span className="text-xs bg-[#7A9D96]/10 text-[#7A9D96] px-2 py-0.5 rounded-full font-bold border border-[#7A9D96]/30">High Achiever</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                            <Calendar className="w-4 h-4 text-[#7A9D96]" />
                          </div>
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Completion Date</div>
                            <div className="font-semibold text-[#2C2C2C] text-sm">
                              {new Date(cert.completionDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                            <Calendar className="w-4 h-4 text-[#7A9D96]" />
                          </div>
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Issued Date</div>
                            <div className="font-semibold text-[#2C2C2C] text-sm">
                              {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course Title */}
                      <div className="bg-[#FAFAF8] rounded-lg p-3 border border-[#E8E8E6]">
                        <div className="text-xs text-[#6B6B6B] mb-1">Course</div>
                        <div className="font-semibold text-[#2C2C2C]">{cert.courseTitle}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      <button onClick={() => handleVerifyCertificate(cert.certificateNumber)} className="flex-1 lg:flex-none px-4 py-2 bg-[#7A9D96] text-white rounded-lg hover:bg-[#6A8D86] transition-all flex items-center justify-center space-x-2 text-sm font-semibold shadow-sm" title="Verify Certificate">
                        <ExternalLink className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {filteredCertificates.length > 0 && (
            <div className="mt-8 text-center text-sm text-[#6B6B6B]">
              Showing {filteredCertificates.length} of {certificates.length} certificates
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminCertificates;
