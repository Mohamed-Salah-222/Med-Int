import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { Mail, CheckCircle, AlertCircle, ArrowRight, Shield, RefreshCw, Sparkles } from "lucide-react";

function VerifyEmail() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];

    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newCode[index] = char;
      }
    });

    setCode(newCode);

    // Focus last filled input or first empty one
    const nextEmptyIndex = newCode.findIndex((c) => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    document.getElementById(`code-${focusIndex}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);

    try {
      await authAPI.verifyEmail(email, fullCode);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await authAPI.resendVerification(email);
      setCode(["", "", "", "", "", ""]);
      document.getElementById("code-0")?.focus();
      // Show success message instead of alert
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Success Screen */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[#FAFAF8]">
          <div className="text-center">
            <div className="mb-6 relative inline-block">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Email Verified!
            </h1>
            <p className="text-lg sm:text-xl text-[#6B6B6B] mb-8">Your email has been successfully verified.</p>
            <div className="flex items-center justify-center text-[#7A9D96]">
              <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-semibold">Redirecting to login...</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center">
          <Sparkles className="w-32 h-32 text-white/20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT SIDE - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[#FAFAF8]">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-8">
            <div onClick={() => navigate("/")} className="flex items-center space-x-3 mb-6 cursor-pointer group w-fit">
              <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] w-12 h-12 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all">
                <Shield className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-[#2C2C2C] group-hover:text-[#7A9D96] transition-colors" style={{ fontFamily: "Lexend, sans-serif" }}>
                Medical Interpreter Academy
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Verify Your Email
            </h1>
            <p className="text-[#6B6B6B]">
              We sent a 6-digit code to <span className="font-semibold text-[#2C2C2C]">{email || "your email"}</span>
            </p>
          </div>

          {/* Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 flex items-start text-sm animate-shake">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Code Inputs */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-3">Verification Code</label>
              <div className="flex gap-2 sm:gap-3 justify-between" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all"
                    disabled={loading}
                    required
                  />
                ))}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-2 text-center">Paste your code or type each digit</p>
            </div>

            {/* Verify Button */}
            <button type="submit" disabled={loading || code.some((d) => !d)} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4 cursor-pointer group">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Verify Email</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Resend Button */}
            <button type="button" onClick={handleResend} disabled={resending} className="w-full border-2 border-[#E8E8E6] text-[#6B6B6B] py-3 rounded-lg font-semibold hover:border-[#7A9D96] hover:text-[#7A9D96] transition-all duration-300 flex items-center justify-center space-x-2 mb-6 cursor-pointer group">
              {resending ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resending...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Resend Code</span>
                </>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <p className="text-sm text-[#6B6B6B]">
                Remember your password?{" "}
                <Link to="/login" className="text-[#7A9D96] font-semibold hover:text-[#6A8D86] hover:underline transition-colors">
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center max-w-lg">
          <Mail className="w-32 h-32 text-white mx-auto mb-8 animate-bounce-slow" strokeWidth={1} />
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
            Check Your Inbox
          </h2>
          <p className="text-xl text-white/90 leading-relaxed mb-8">We've sent a verification code to your email address. Enter it to activate your account and start learning.</p>

          {/* Tips */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-left hover:bg-white/15 transition-all">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Can't find the email?
            </h3>
            <ul className="text-white/80 text-sm space-y-2">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and click "Resend Code"</li>
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

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;
