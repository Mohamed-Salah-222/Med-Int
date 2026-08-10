import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Shield, Download, CheckCircle, ExternalLink, Award, FileX } from "lucide-react";
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
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1B3A5C] mx-auto mb-4"></div>
            <p className="text-xl text-[#5A5A5A] font-semibold">Loading certificates...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !certificates || (!certificates.main && !certificates.hipaa)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
          <div className="text-center">
            <FileX className="w-16 h-16 text-[#5A5A5A] mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">{error || "No certificates found"}</h2>
            <button onClick={() => navigate("/dashboard")} className="bg-[#1B3A5C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#16304d] transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F7F7F5] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Confirmation Header — flat, navy-tinted with accent bar (not a hero banner) */}
          <div className="bg-[#1B3A5C]/5 border border-[#1B3A5C]/20 border-l-4 border-l-[#1B3A5C] rounded-xl p-6 sm:p-8 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 sm:w-8 sm:h-8 text-[#1B3A5C]" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Congratulations!
                </h1>
                <p className="text-sm sm:text-base text-[#5A5A5A]">You have successfully completed the Medical Interpretation Course</p>
              </div>
            </div>
          </div>

          {/* Certificates Section */}
          <div className="space-y-8 mb-12">
            {/* Main Medical Interpreter Certificate */}
            {certificates.main && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E5E5E3]">
                {/* Certificate Header — solid navy */}
                <div className="bg-[#1B3A5C] text-white p-4 sm:p-6">
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
                      <p className="text-[#5A5A5A]">Certificate image not available</p>
                    </div>
                  )}
                </div>

                {/* Certificate Actions */}
                <div className="p-4 sm:p-6 bg-[#F7F7F5] border-t border-[#E5E5E3]">
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <button onClick={() => handleDownloadCertificate(certificates.main!, "medical")} className="bg-[#1B3A5C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#16304d] transition-all flex items-center justify-center space-x-2">
                      <Download className="w-5 h-5" />
                      <span>Download Certificate</span>
                    </button>
                    <button onClick={() => handleViewVerification(certificates.main!)} className="bg-white border-2 border-[#1B3A5C] text-[#1B3A5C] px-6 py-3 rounded-lg font-semibold hover:bg-[#1B3A5C] hover:text-white transition-all flex items-center justify-center space-x-2">
                      <ExternalLink className="w-5 h-5" />
                      <span>Verify Certificate</span>
                    </button>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Certificate Number</p>
                      <p className="font-mono text-[#1A1A1A] font-bold">{certificates.main.certificateNumber}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Verification Code</p>
                      <p className="font-mono text-[#1A1A1A] font-bold">{certificates.main.verificationCode}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Completion Date</p>
                      <p className="text-[#1A1A1A] font-semibold">
                        {new Date(certificates.main.completionDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Final Exam Score</p>
                      <p className="text-[#1B3A5C] font-bold text-lg">{certificates.main.finalExamScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HIPAA Certificate */}
            {certificates.hipaa && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E5E5E3]">
                {/* Certificate Header — solid dark */}
                <div className="bg-[#1A1A1A] text-white p-4 sm:p-6">
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
                      <p className="text-[#5A5A5A]">Certificate image not available</p>
                    </div>
                  )}
                </div>

                {/* Certificate Actions */}
                <div className="p-4 sm:p-6 bg-[#F7F7F5] border-t border-[#E5E5E3]">
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <button onClick={() => handleDownloadCertificate(certificates.hipaa!, "hipaa")} className="bg-[#1A1A1A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2C2C2C] transition-all flex items-center justify-center space-x-2">
                      <Download className="w-5 h-5" />
                      <span>Download Certificate</span>
                    </button>
                    <button onClick={() => handleViewVerification(certificates.hipaa!)} className="bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] px-6 py-3 rounded-lg font-semibold hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center justify-center space-x-2">
                      <ExternalLink className="w-5 h-5" />
                      <span>Verify Certificate</span>
                    </button>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Certificate Number</p>
                      <p className="font-mono text-[#1A1A1A] font-bold">{certificates.hipaa.certificateNumber}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Verification Code</p>
                      <p className="font-mono text-[#1A1A1A] font-bold">{certificates.hipaa.verificationCode}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Issued Date</p>
                      <p className="text-[#1A1A1A] font-semibold">
                        {new Date(certificates.hipaa.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E3]">
                      <p className="text-[#5A5A5A] text-xs mb-1">Status</p>
                      <p className="text-[#1B3A5C] font-bold flex items-center">
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
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-[#E5E5E3]">
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
              <Shield className="w-6 h-6 text-[#1B3A5C] mr-3" />
              About Your Certificates
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#1B3A5C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] mb-1">Digital Certificates</h4>
                  <p className="text-sm text-[#5A5A5A]">High-quality PNG images ready to share with employers or print</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#1B3A5C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] mb-1">QR Code Verification</h4>
                  <p className="text-sm text-[#5A5A5A]">Each certificate includes a QR code for instant verification</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#1B3A5C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] mb-1">Secure Storage</h4>
                  <p className="text-sm text-[#5A5A5A]">Certificates are securely stored and accessible anytime</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-[#1B3A5C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] mb-1">Lifetime Validity</h4>
                  <p className="text-sm text-[#5A5A5A]">Your certificates never expire and remain valid indefinitely</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center mt-8">
            <button onClick={() => navigate("/dashboard")} className="bg-white border-2 border-[#1B3A5C] text-[#1B3A5C] px-8 py-3 rounded-xl font-semibold hover:bg-[#1B3A5C] hover:text-white transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CertificateView;
