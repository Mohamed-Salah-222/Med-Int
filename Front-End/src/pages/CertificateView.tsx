import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";

interface Certificate {
  certificateNumber: string;
  verificationCode: string;
  userName: string;
  courseTitle: string;
  completionDate: string;
  finalExamScore: number;
  issuedAt: string;
}

function CertificateView() {
  const { id } = useParams(); // course ID
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await courseAPI.getCertificate(id!);
        setCertificate(response.data.certificate);
      } catch (error: any) {
        console.error("Error fetching certificate:", error);
        if (error.response?.status === 404) {
          setError("Certificate not found. Complete the course to earn your certificate.");
        } else {
          setError("Failed to load certificate");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading certificate...</div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📜</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">{error || "No certificate found"}</h2>
          <button onClick={() => navigate("/dashboard")} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
          <button onClick={() => navigate("/dashboard")} className="text-gray-600 hover:text-gray-900">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-4xl font-bold mb-2">Congratulations!</h1>
          <p className="text-xl">You have successfully completed the Medical Interpretation Course</p>
        </div>

        {/* Certificates Display */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Certificate */}
          <div className="bg-white rounded-lg shadow-xl p-8 border-4 border-blue-500">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📜</div>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Medical Interpreter Certificate</h2>
              <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
            </div>

            <div className="space-y-4">
              <div className="text-center py-6 border-t border-b border-gray-200">
                <p className="text-gray-600 mb-2">This certifies that</p>
                <p className="text-3xl font-bold text-gray-900">{certificate.userName}</p>
                <p className="text-gray-600 mt-2">has successfully completed</p>
                <p className="text-xl font-semibold text-gray-800 mt-1">{certificate.courseTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Certificate Number:</p>
                  <p className="font-mono text-gray-900">{certificate.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Verification Code:</p>
                  <p className="font-mono text-gray-900">{certificate.verificationCode}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Completion Date:</p>
                  <p className="text-gray-900">{new Date(certificate.completionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Final Exam Score:</p>
                  <p className="text-gray-900">{certificate.finalExamScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* HIPAA Certificate */}
          <div className="bg-white rounded-lg shadow-xl p-8 border-4 border-green-500">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">HIPAA Compliance Certificate</h2>
              <div className="h-1 w-20 bg-green-600 mx-auto"></div>
            </div>

            <div className="space-y-4">
              <div className="text-center py-6 border-t border-b border-gray-200">
                <p className="text-gray-600 mb-2">This certifies that</p>
                <p className="text-3xl font-bold text-gray-900">{certificate.userName}</p>
                <p className="text-gray-600 mt-2">has successfully completed</p>
                <p className="text-xl font-semibold text-gray-800 mt-1">HIPAA for Medical Interpreters</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Certificate Number:</p>
                  <p className="font-mono text-gray-900">{certificate.certificateNumber}-H</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Verification Code:</p>
                  <p className="font-mono text-gray-900">{certificate.verificationCode}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Issued Date:</p>
                  <p className="text-gray-900">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Status:</p>
                  <p className="text-green-600 font-semibold">✓ Valid</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">About Your Certificates</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>These certificates have been sent to your email</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save your certificate numbers and verification codes for future reference</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Employers can verify your certificates using the certificate number and verification code</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Print Certificates
          </button>
          <button onClick={() => navigate("/dashboard")} className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default CertificateView;
