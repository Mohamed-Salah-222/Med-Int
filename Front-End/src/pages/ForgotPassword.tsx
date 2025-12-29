import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { Mail, AlertCircle, CheckCircle, ArrowRight, Shield, KeyRound, Send } from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Success Screen */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAFAF8]">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 relative inline-block">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-green-500 w-20 h-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Check Your Email
            </h1>
            <p className="text-lg text-[#6B6B6B] mb-8">
              We've sent a password reset link to <span className="font-semibold text-[#2C2C2C]">{email}</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <div className="flex items-start text-left">
                <Mail className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Didn't receive the email?</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Check your spam or junk folder</li>
                    <li>• Make sure you entered the correct email</li>
                    <li>• Wait a few minutes and try again</li>
                  </ul>
                </div>
              </div>
            </div>

            <Link to="/login" className="inline-flex items-center space-x-2 text-[#7A9D96] font-semibold hover:text-[#6A8D86] transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center">
          <Mail className="w-32 h-32 text-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] w-12 h-12 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-2xl font-bold text-[#2C2C2C]">Medical Interpreter Academy</span>
            </div>
            <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Reset Password
            </h1>
            <p className="text-[#6B6B6B]">Enter your email and we'll send you a reset link</p>
          </div>

          {/* Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 flex items-start text-sm animate-shake">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="you@example.com" required disabled={loading} autoFocus />
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending link...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center space-x-2 text-sm text-[#6B6B6B] hover:text-[#7A9D96] transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center max-w-lg">
          <KeyRound className="w-32 h-32 text-white mx-auto mb-8 animate-float" strokeWidth={1} />
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
            Don't Worry
          </h2>
          <p className="text-xl text-white/90 leading-relaxed mb-8">It happens to everyone. We'll send you a secure link to reset your password and get you back on track.</p>

          {/* Security Info */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-left">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security First
            </h3>
            <ul className="text-white/80 text-sm space-y-2">
              <li>• Reset links expire after 1 hour</li>
              <li>• Links can only be used once</li>
              <li>• We'll never ask for your password via email</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ForgotPassword;
