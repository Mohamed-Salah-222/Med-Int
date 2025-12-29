import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../services/api";
import { Lock, AlertCircle, CheckCircle, ArrowRight, Shield, Eye, EyeOff, KeyRound } from "lucide-react";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, color: "" });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const checkPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-600"];
    return { score, color: colors[score] };
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and number");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Success Screen */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAFAF8]">
          <div className="text-center">
            <div className="mb-6 relative inline-block">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-green-500 w-24 h-24 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Password Reset!
            </h1>
            <p className="text-xl text-[#6B6B6B] mb-8">Your password has been successfully updated.</p>
            <div className="flex items-center justify-center text-[#7A9D96]">
              <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Redirecting to login...</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center">
          <CheckCircle className="w-32 h-32 text-white/20" />
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
              Create New Password
            </h1>
            <p className="text-[#6B6B6B]">Choose a strong password to secure your account</p>
          </div>

          {/* Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 flex items-start text-sm animate-shake">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => handlePasswordChange(e.target.value)} className="w-full px-4 py-2.5 pr-10 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="••••••••" minLength={8} required disabled={loading || !token} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#7A9D96]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-[#E8E8E6] rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-1">Use 8+ chars with uppercase, lowercase & number</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 pr-10 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="••••••••" minLength={8} required disabled={loading || !token} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#7A9D96]">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2 flex items-center">
                  {password === confirmPassword ? (
                    <div className="flex items-center text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      <span>Passwords don't match</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading || !token || password !== confirmPassword} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resetting password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
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
            Almost There
          </h2>
          <p className="text-xl text-white/90 leading-relaxed mb-8">Choose a strong, unique password to keep your account secure and continue your certification journey.</p>

          {/* Password Tips */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-left">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Password Best Practices
            </h3>
            <ul className="text-white/80 text-sm space-y-2">
              <li>• Use at least 8 characters</li>
              <li>• Mix uppercase and lowercase letters</li>
              <li>• Include numbers and symbols</li>
              <li>• Avoid common words or patterns</li>
              <li>• Don't reuse passwords from other sites</li>
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

export default ResetPassword;
