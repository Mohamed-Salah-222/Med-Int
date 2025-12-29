import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Award, Search, Calendar, User, Mail, FileText, Download, ExternalLink, Filter } from "lucide-react";

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
          <div className="text-xl text-[#6B6B6B]">Loading certificates...</div>
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
              Certificates
            </h1>
            <p className="text-[#6B6B6B]">View all issued certificates</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{certificates.length}</div>
              <div className="text-sm text-[#6B6B6B]">Total Certificates</div>
            </div>

            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white">
              <Award className="w-8 h-8 mb-4" strokeWidth={2} />
              <div className="text-3xl font-bold mb-1">{certificates.filter((c) => new Date(c.issuedAt).getMonth() === new Date().getMonth()).length}</div>
              <div className="text-sm opacity-90">Issued This Month</div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="text-3xl font-bold text-green-800">{certificates.length > 0 ? Math.round(certificates.reduce((sum, c) => sum + c.finalExamScore, 0) / certificates.length) : 0}%</div>
              <div className="text-sm text-green-600">Average Exam Score</div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="text-3xl font-bold text-blue-800">{certificates.filter((c) => c.finalExamScore >= 90).length}</div>
              <div className="text-sm text-blue-600">High Achievers (90%+)</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Search className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Search Certificates
                </label>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or certificate number..." className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-[#7A9D96]" />
                  Sort By
                </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score">Highest Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Certificates List */}
          {filteredCertificates.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E6]">
              <Award className="w-16 h-16 text-[#E8E8E6] mx-auto mb-4" />
              <p className="text-[#6B6B6B] text-lg">{search ? "No certificates found matching your search" : "No certificates issued yet"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((cert) => (
                <div key={cert._id} className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center text-white font-bold">{cert.userName.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3 className="text-xl font-bold text-[#2C2C2C]">{cert.userName}</h3>
                          <div className="flex items-center text-sm text-[#6B6B6B]">
                            <Mail className="w-3 h-3 mr-1" />
                            {cert.userEmail}
                          </div>
                        </div>
                      </div>

                      {/* Certificate Details */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <FileText className="w-5 h-5 text-[#7A9D96] mt-0.5" />
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Certificate Number</div>
                            <div className="font-mono font-semibold text-[#2C2C2C]">{cert.certificateNumber}</div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Award className="w-5 h-5 text-[#7A9D96] mt-0.5" />
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Final Exam Score</div>
                            <div className="font-semibold text-[#2C2C2C]">
                              {cert.finalExamScore}%{cert.finalExamScore >= 90 && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">High Achiever</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-[#7A9D96] mt-0.5" />
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Completion Date</div>
                            <div className="font-semibold text-[#2C2C2C]">
                              {new Date(cert.completionDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-[#7A9D96] mt-0.5" />
                          <div>
                            <div className="text-xs text-[#6B6B6B]">Issued Date</div>
                            <div className="font-semibold text-[#2C2C2C]">
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
                    <div className="ml-6 flex flex-col space-y-2">
                      <button onClick={() => handleVerifyCertificate(cert.certificateNumber)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center space-x-2 text-sm font-semibold" title="Verify Certificate">
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
