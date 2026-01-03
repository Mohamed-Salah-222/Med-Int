import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Shield, Download, CheckCircle, ExternalLink, Award } from "lucide-react";
import Layout from "../components/Layout";

interface Certificate {
  certificateNumber: string;
  verificationCode: string;
  userName: string;
  courseTitle: string;
  completionDate: string;
  finalExamScore: number;
  issuedAt: string;
  certificateImageUrl?: string;
}

interface CertificatesResponse {
  main: Certificate | null;
  hipaa: Certificate | null;
}

function CertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<CertificatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await courseAPI.getCertificates(id!);
        setCertificates(response.data.certificates);
      } catch (error: any) {
        console.error("Error fetching certificates:", error);
        if (error.response?.status === 404) {
          setError("Certificates not found. Complete the course to earn your certificates.");
        } else {
          setError("Failed to load certificates");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [id]);

  const handleDownloadCertificate = async (cert: Certificate, type: "medical" | "hipaa") => {
    if (!cert.certificateImageUrl) {
      alert("Certificate image not available");
      return;
    }

    try {
      // Fetch the image as a blob
      const response = await fetch(cert.certificateImageUrl);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type === "medical" ? "Medical-Interpreter" : "HIPAA-Compliance"}-Certificate-${cert.certificateNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  const handleViewVerification = (cert: Certificate) => {
    window.open(`/verify-certificate?certificateNumber=${cert.certificateNumber}&verificationCode=${cert.verificationCode}`, "_blank");
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

  if (error || !certificates || (!certificates.main && !certificates.hipaa)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">{error || "No certificates found"}</h2>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8 sm:mb-12 text-center">
            <div className="text-6xl sm:text-7xl mb-6">🎓</div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Congratulations!
            </h1>
            <p className="text-lg sm:text-2xl text-white/90">You have successfully completed the Medical Interpretation Course</p>
          </div>

          {/* Certificates Section */}
          <div className="space-y-8 mb-12">
            {/* Main Medical Interpreter Certificate */}
            {certificates.main && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#E8E8E6]">
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <Award className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">Medical Interpreter Certificate</h2>
                        <p className="text-sm text-white/80">Professional Training Completion</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Image */}
                <div className="relative">
                  {certificates.main.certificateImageUrl ? (
                    <img src={certificates.main.certificateImageUrl} alt="Medical Interpreter Certificate" className="w-full h-auto" />
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-[#6B6B6B]">Certificate image not available</p>
                    </div>
                  )}
                </div>

                {/* Certificate Actions */}
                <div className="p-4 sm:p-6 bg-[#FAFAF8] border-t border-[#E8E8E6]">
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <button onClick={() => handleDownloadCertificate(certificates.main!, "medical")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                      <Download className="w-5 h-5" />
                      <span>Download Certificate</span>
                    </button>
                    <button onClick={() => handleViewVerification(certificates.main!)} className="bg-white border-2 border-[#7A9D96] text-[#7A9D96] px-6 py-3 rounded-lg font-semibold hover:bg-[#7A9D96] hover:text-white transition-all flex items-center justify-center space-x-2">
                      <ExternalLink className="w-5 h-5" />
                      <span>Verify Certificate</span>
                    </button>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Certificate Number</p>
                      <p className="font-mono text-[#2C2C2C] font-bold">{certificates.main.certificateNumber}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Verification Code</p>
                      <p className="font-mono text-[#2C2C2C] font-bold">{certificates.main.verificationCode}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Completion Date</p>
                      <p className="text-[#2C2C2C] font-semibold">
                        {new Date(certificates.main.completionDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Final Exam Score</p>
                      <p className="text-[#7A9D96] font-bold text-lg">{certificates.main.finalExamScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HIPAA Certificate */}
            {certificates.hipaa && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#E8E8E6]">
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] text-white p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">HIPAA Compliance Certificate</h2>
                        <p className="text-sm text-white/80">Patient Privacy & Data Protection</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Image */}
                <div className="relative">
                  {certificates.hipaa.certificateImageUrl ? (
                    <img src={certificates.hipaa.certificateImageUrl} alt="HIPAA Compliance Certificate" className="w-full h-auto" />
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-[#6B6B6B]">Certificate image not available</p>
                    </div>
                  )}
                </div>

                {/* Certificate Actions */}
                <div className="p-4 sm:p-6 bg-[#FAFAF8] border-t border-[#E8E8E6]">
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <button onClick={() => handleDownloadCertificate(certificates.hipaa!, "hipaa")} className="bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                      <Download className="w-5 h-5" />
                      <span>Download Certificate</span>
                    </button>
                    <button onClick={() => handleViewVerification(certificates.hipaa!)} className="bg-white border-2 border-[#2C2C2C] text-[#2C2C2C] px-6 py-3 rounded-lg font-semibold hover:bg-[#2C2C2C] hover:text-white transition-all flex items-center justify-center space-x-2">
                      <ExternalLink className="w-5 h-5" />
                      <span>Verify Certificate</span>
                    </button>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Certificate Number</p>
                      <p className="font-mono text-[#2C2C2C] font-bold">{certificates.hipaa.certificateNumber}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Verification Code</p>
                      <p className="font-mono text-[#2C2C2C] font-bold">{certificates.hipaa.verificationCode}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Issued Date</p>
                      <p className="text-[#2C2C2C] font-semibold">
                        {new Date(certificates.hipaa.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E8E8E6]">
                      <p className="text-[#6B6B6B] text-xs mb-1">Status</p>
                      <p className="text-[#7A9D96] font-bold flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Valid
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Certificate Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-[#E8E8E6]">
            <h3 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center">
              <Shield className="w-6 h-6 text-[#7A9D96] mr-3" />
              About Your Certificates
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#7A9D96]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Digital Certificates</h4>
                  <p className="text-sm text-[#6B6B6B]">High-quality PNG images ready to share with employers or print</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#7A9D96]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">QR Code Verification</h4>
                  <p className="text-sm text-[#6B6B6B]">Each certificate includes a QR code for instant verification</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#7A9D96]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Secure Storage</h4>
                  <p className="text-sm text-[#6B6B6B]">Certificates are securely stored and accessible anytime</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#7A9D96]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Lifetime Validity</h4>
                  <p className="text-sm text-[#6B6B6B]">Your certificates never expire and remain valid indefinitely</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center mt-8">
            <button onClick={() => navigate("/dashboard")} className="bg-white border-2 border-[#7A9D96] text-[#7A9D96] px-8 py-3 rounded-xl font-semibold hover:bg-[#7A9D96] hover:text-white transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CertificateView;
