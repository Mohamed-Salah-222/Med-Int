import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Shield, CheckCircle, XCircle, Search, AlertTriangle, Calendar, User, Award, Home } from "lucide-react";
import Layout from "../components/Layout";

interface VerificationResult {
  valid: boolean;
  certificate?: {
    certificateNumber: string;
    userName: string;
    courseTitle: string;
    completionDate: string;
    issuedAt: string;
  };
  message?: string;
}

function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [certificateNumber, setCertificateNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-fill from URL params (for QR code scanning)
  useEffect(() => {
    const certNum = searchParams.get("certificateNumber");
    const verifCode = searchParams.get("verificationCode");

    if (certNum && verifCode) {
      setCertificateNumber(certNum);
      setVerificationCode(verifCode);
      // Auto-verify if both params present
      handleVerify(certNum, verifCode);
    }
  }, [searchParams]);

  const handleVerify = async (certNum?: string, verifCode?: string) => {
    const certNumToUse = certNum || certificateNumber;
    const verifCodeToUse = verifCode || verificationCode;

    if (!certNumToUse.trim() || !verifCodeToUse.trim()) {
      alert("Please enter both certificate number and verification code");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setResult(null);

    try {
      const response = await courseAPI.verifyCertificate(certNumToUse, verifCodeToUse);
      setResult(response.data);
    } catch (error: any) {
      console.error("Verification error:", error);
      if (error.response?.status === 404) {
        setResult({
          valid: false,
          message: "Certificate not found or verification code is incorrect",
        });
      } else {
        setResult({
          valid: false,
          message: "Verification failed. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCertificateNumber("");
    setVerificationCode("");
    setResult(null);
    setHasSearched(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-full mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Certificate Verification
            </h1>
            <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">Verify the authenticity of Medical Interpreter certificates issued by our platform</p>
          </div>

          {/* Verification Form */}
          {!hasSearched && (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border-2 border-[#E8E8E6]">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Certificate Number *</label>
                <input type="text" value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())} placeholder="e.g., MIC-2026-ABC123" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none font-mono text-lg transition-all" disabled={loading} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Verification Code *</label>
                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.toUpperCase())} placeholder="e.g., A1B2C3D4" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none font-mono text-lg transition-all" disabled={loading} />
              </div>

              <button onClick={() => handleVerify()} disabled={loading || !certificateNumber.trim() || !verificationCode.trim()} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    <span>Verify Certificate</span>
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border-l-4 border-[#7A9D96] p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-[#7A9D96] mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#6B6B6B]">
                    <p className="font-semibold text-[#2C2C2C] mb-1">How to verify:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Enter the certificate number found on the certificate</li>
                      <li>Enter the verification code provided with the certificate</li>
                      <li>Or scan the QR code on the certificate for instant verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {hasSearched && result && (
            <div className="space-y-6">
              {/* Valid Certificate */}
              {result.valid && result.certificate && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#7A9D96]">
                  {/* Success Header */}
                  <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white p-6 sm:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                      <CheckCircle className="w-12 h-12" strokeWidth={2} />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-2">Certificate Valid ✓</h2>
                    <p className="text-lg text-white/90">This is an authentic certificate</p>
                  </div>

                  {/* Certificate Details */}
                  <div className="p-6 sm:p-8">
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-[#7A9D96]/10 rounded-lg p-3">
                          <User className="w-6 h-6 text-[#7A9D96]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#6B6B6B] mb-1">Certificate Holder</p>
                          <p className="text-xl font-bold text-[#2C2C2C]">{result.certificate.userName}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-[#7A9D96]/10 rounded-lg p-3">
                          <Award className="w-6 h-6 text-[#7A9D96]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#6B6B6B] mb-1">Course Title</p>
                          <p className="text-lg font-semibold text-[#2C2C2C]">{result.certificate.courseTitle}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-[#7A9D96]/10 rounded-lg p-3">
                          <Shield className="w-6 h-6 text-[#7A9D96]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#6B6B6B] mb-1">Certificate Number</p>
                          <p className="text-lg font-mono font-semibold text-[#2C2C2C]">{result.certificate.certificateNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-[#7A9D96]/10 rounded-lg p-3">
                          <Calendar className="w-6 h-6 text-[#7A9D96]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#6B6B6B] mb-1">Completion Date</p>
                          <p className="text-lg font-semibold text-[#2C2C2C]">
                            {new Date(result.certificate.completionDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Verification Badge */}
                    <div className="bg-[#7A9D96]/10 border-2 border-[#7A9D96]/30 rounded-xl p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-[#7A9D96] mx-auto mb-3" />
                      <p className="text-lg font-bold text-[#7A9D96] mb-1">Verified & Authentic</p>
                      <p className="text-sm text-[#6B6B6B]">This certificate has been verified and is valid</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invalid Certificate */}
              {!result.valid && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-red-500">
                  {/* Error Header */}
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 sm:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                      <XCircle className="w-12 h-12" strokeWidth={2} />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-2">Certificate Not Found</h2>
                    <p className="text-lg text-white/90">This certificate could not be verified</p>
                  </div>

                  {/* Error Details */}
                  <div className="p-6 sm:p-8">
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-6">
                      <p className="text-red-800 font-semibold mb-2">Verification Failed</p>
                      <p className="text-red-700">{result.message || "The certificate number and verification code do not match our records."}</p>
                    </div>

                    <div className="space-y-3 text-sm text-[#6B6B6B]">
                      <p className="font-semibold text-[#2C2C2C]">Possible reasons:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>The certificate number or verification code was entered incorrectly</li>
                        <li>The certificate may have been revoked or is not yet issued</li>
                        <li>The certificate may be fraudulent</li>
                      </ul>
                      <p className="mt-4 font-semibold text-[#2C2C2C]">Please double-check the information and try again.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={handleReset} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Verify Another Certificate</span>
                </button>
                <button onClick={() => navigate("/")} className="bg-white border-2 border-[#7A9D96] text-[#7A9D96] px-8 py-3 rounded-xl font-semibold hover:bg-[#7A9D96] hover:text-white transition-all flex items-center justify-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default VerifyCertificate;
