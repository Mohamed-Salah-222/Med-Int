import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Shield, Download, Printer, CheckCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
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
  const certificatesRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = useReactToPrint({
    contentRef: certificatesRef,
  });
  const handleDownloadPDF = useReactToPrint({
    contentRef: certificatesRef,
    documentTitle: `Medical-Interpreter-Certificates-${certificates?.main?.userName.replace(/\s+/g, "-") || "User"}-${new Date().toISOString().split("T")[0]}`,
  });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-[#6B6B6B]">Loading certificates...</div>
        </div>
      </Layout>
    );
  }

  if (error || !certificates || (!certificates.main && !certificates.hipaa)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">{error || "No certificates found"}</h2>
            <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12 print:py-0">
        <div className="max-w-7xl mx-auto px-6 print:px-0">
          {/* Success Banner - Hidden on print */}
          <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-12 mb-12 text-center print:hidden">
            <div className="text-7xl mb-6">🎓</div>
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Congratulations!
            </h1>
            <p className="text-2xl text-white/90">You have successfully completed the Medical Interpretation Course</p>
          </div>

          {/* Action Buttons - Hidden on print */}
          <div className="flex justify-center space-x-4 mb-12 print:hidden">
            <button onClick={handlePrint} className="bg-white border-2 border-[#7A9D96] text-[#7A9D96] px-8 py-4 rounded-lg font-semibold hover:bg-[#7A9D96] hover:text-white transition-all shadow-md flex items-center space-x-2">
              <Printer className="w-5 h-5" />
              <span>Print Certificates</span>
            </button>
            <button onClick={handleDownloadPDF} className="bg-[#7A9D96] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all shadow-md flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Save as PDF</span>
            </button>
          </div>

          {/* Certificates Grid */}
          <div ref={certificatesRef} className="space-y-8 mb-12">
            {/* Main Certificate */}
            {certificates.main && (
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:break-inside-avoid">
                {certificates.main.certificateImageUrl ? (
                  // Display the generated certificate image
                  <img src={certificates.main.certificateImageUrl} alt="Medical Interpreter Certificate" className="w-full h-auto" />
                ) : (
                  // Fallback to text-based design if image doesn't exist
                  <div className="p-10 border-4 border-[#7A9D96]">
                    <div className="text-center mb-8">
                      <Shield className="w-16 h-16 text-[#7A9D96] mx-auto mb-4" strokeWidth={1.5} />
                      <h2 className="text-3xl font-bold text-[#7A9D96] mb-3" style={{ fontFamily: "Lexend, sans-serif" }}>
                        Medical Interpreter Certificate
                      </h2>
                      <div className="h-1 w-24 bg-[#7A9D96] mx-auto"></div>
                    </div>

                    <div className="space-y-6">
                      <div className="text-center py-8 border-t-2 border-b-2 border-[#E8E8E6]">
                        <p className="text-[#6B6B6B] mb-3 text-lg">This certifies that</p>
                        <p className="text-4xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                          {certificates.main.userName}
                        </p>
                        <p className="text-[#6B6B6B] mb-2">has successfully completed</p>
                        <p className="text-2xl font-semibold text-[#2C2C2C]">{certificates.main.courseTitle}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-[#7A9D96]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Certificate Number</p>
                          <p className="font-mono text-[#2C2C2C] font-bold">{certificates.main.certificateNumber}</p>
                        </div>
                        <div className="bg-[#7A9D96]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Verification Code</p>
                          <p className="font-mono text-[#2C2C2C] font-bold">{certificates.main.verificationCode}</p>
                        </div>
                        <div className="bg-[#7A9D96]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Completion Date</p>
                          <p className="text-[#2C2C2C] font-semibold">
                            {new Date(certificates.main.completionDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="bg-[#7A9D96]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Final Exam Score</p>
                          <p className="text-[#2C2C2C] font-semibold">{certificates.main.finalExamScore}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HIPAA Certificate */}
            {certificates.hipaa && (
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:break-inside-avoid">
                {certificates.hipaa.certificateImageUrl ? (
                  // Display the generated certificate image
                  <img src={certificates.hipaa.certificateImageUrl} alt="HIPAA Compliance Certificate" className="w-full h-auto" />
                ) : (
                  // Fallback to text-based design if image doesn't exist
                  <div className="p-10 border-4 border-[#2C2C2C]">
                    <div className="text-center mb-8">
                      <Shield className="w-16 h-16 text-[#2C2C2C] mx-auto mb-4" strokeWidth={1.5} />
                      <h2 className="text-3xl font-bold text-[#2C2C2C] mb-3" style={{ fontFamily: "Lexend, sans-serif" }}>
                        HIPAA Compliance Certificate
                      </h2>
                      <div className="h-1 w-24 bg-[#2C2C2C] mx-auto"></div>
                    </div>

                    <div className="space-y-6">
                      <div className="text-center py-8 border-t-2 border-b-2 border-[#E8E8E6]">
                        <p className="text-[#6B6B6B] mb-3 text-lg">This certifies that</p>
                        <p className="text-4xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                          {certificates.hipaa.userName}
                        </p>
                        <p className="text-[#6B6B6B] mb-2">has successfully completed</p>
                        <p className="text-2xl font-semibold text-[#2C2C2C]">{certificates.hipaa.courseTitle}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-[#2C2C2C]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Certificate Number</p>
                          <p className="font-mono text-[#2C2C2C] font-bold">{certificates.hipaa.certificateNumber}</p>
                        </div>
                        <div className="bg-[#2C2C2C]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Verification Code</p>
                          <p className="font-mono text-[#2C2C2C] font-bold">{certificates.hipaa.verificationCode}</p>
                        </div>
                        <div className="bg-[#2C2C2C]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Issued Date</p>
                          <p className="text-[#2C2C2C] font-semibold">
                            {new Date(certificates.hipaa.issuedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="bg-[#2C2C2C]/5 p-4 rounded-lg">
                          <p className="text-[#6B6B6B] font-medium mb-1">Status</p>
                          <p className="text-green-600 font-semibold flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Valid
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Certificate Information - Hidden on print */}
          <div className="bg-white rounded-2xl shadow-lg p-8 print:hidden">
            <h3 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center">
              <Shield className="w-6 h-6 text-[#7A9D96] mr-3" />
              About Your Certificates
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-[#7A9D96] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Email Confirmation</h4>
                  <p className="text-[#6B6B6B]">Both certificates have been sent to your registered email address</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-[#7A9D96] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Verification</h4>
                  <p className="text-[#6B6B6B]">Employers can verify your certificates using the certificate number and verification code</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-[#7A9D96] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Secure Storage</h4>
                  <p className="text-[#6B6B6B]">Save your certificate numbers and codes in a secure location for future reference</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-[#7A9D96] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-[#2C2C2C] mb-1">Lifetime Access</h4>
                  <p className="text-[#6B6B6B]">Access your certificates anytime from your dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CertificateView;
