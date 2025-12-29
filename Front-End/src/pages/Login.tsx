import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Shield, Eye, EyeOff, CheckCircle, Award, BookOpen } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth?.login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
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
              Welcome Back
            </h1>
            <p className="text-[#6B6B6B]">Continue your learning journey</p>
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
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="you@example.com" required disabled={loading} />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-[#2C2C2C]">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#7A9D96] hover:text-[#6A8D86] font-semibold">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 pr-10 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none transition-all text-sm" placeholder="••••••••" required disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#7A9D96]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6B6B]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#7A9D96] font-semibold hover:text-[#6A8D86]">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
          {/* Main Content */}
          <div className="text-white mb-12">
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
              Continue Your Certification Journey
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">Pick up right where you left off and complete your path to becoming a certified medical interpreter.</p>
          </div>

          {/* Progress Stats */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 transform hover:scale-105 transition-transform">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Track Your Progress</h3>
                  <p className="text-white/80 text-sm">See exactly where you are in your learning journey</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 transform hover:scale-105 transition-transform">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Complete Lessons</h3>
                  <p className="text-white/80 text-sm">Interactive quizzes after each lesson</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 transform hover:scale-105 transition-transform">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Earn Certificates</h3>
                  <p className="text-white/80 text-sm">Get dual certified upon course completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 rounded-2xl p-12 text-center">
            <p className="text-white/60 text-sm font-medium">Image Placeholder</p>
            <p className="text-white/40 text-xs mt-1">Student dashboard preview</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Login;
