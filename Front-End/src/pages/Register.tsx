import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { UserPlus, Mail, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight, Shield, Award, TrendingUp } from "lucide-react";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, color: "" });
  const navigate = useNavigate();

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
    setLoading(true);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and number");
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate("/verify-email", { state: { email } }), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

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
              Create Account
            </h1>
            <p className="text-[#6B6B6B]">Start your certification journey today</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start text-sm animate-shake">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 flex items-start text-sm animate-bounce-in">
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>Success! Redirecting...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="Enter your full name" required disabled={loading} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="you@example.com" required disabled={loading} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => handlePasswordChange(e.target.value)} className="w-full px-4 py-2.5 pr-10 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="••••••••" minLength={8} required disabled={loading} />
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

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6B6B]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#7A9D96] font-semibold hover:text-[#6A8D86]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
          {/* Main Content */}
          <div className="text-white mb-12">
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
              Launch Your Medical Interpreter Career
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">Join thousands of certified medical interpreters making a difference in healthcare while building a secure, AI-proof career.</p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 transform hover:scale-105 transition-transform">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Dual Certification</h3>
                  <p className="text-white/80 text-sm">Earn Medical Interpreter + HIPAA certificates</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 transform hover:scale-105 transition-transform">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">High Earning Potential</h3>
                  <p className="text-white/80 text-sm">$25-$45/hour with flexible scheduling</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 transform hover:scale-105 transition-transform">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">AI-Proof Career</h3>
                  <p className="text-white/80 text-sm">Required by law, cannot be automated</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 rounded-2xl p-12 text-center">
            <p className="text-white/60 text-sm font-medium">Image Placeholder</p>
            <p className="text-white/40 text-xs mt-1">Add your hero image here</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.5); }
          50% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Register;
