import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, TrendingUp, Award, CheckCircle, BookOpen, Target, LogOut, LayoutDashboard, User as UserIcon, Settings, Mail, AlertCircle } from "lucide-react";

function Landing() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9D96]"></div>
      </div>
    );
  }

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="flex items-center space-x-3 cursor-pointer group">
            {/* Mobile: M.I.A */}
            <span className="md:hidden text-xl font-bold text-[#7A9D96] group-hover:scale-105 transition-transform" style={{ fontFamily: "Lexend, sans-serif" }}>
              M.I.A
            </span>
            {/* Desktop: Full name */}
            <span className="hidden md:block text-xl font-bold text-[#7A9D96] group-hover:scale-105 transition-transform" style={{ fontFamily: "Lexend, sans-serif" }}>
              Medical Interpreter Academy
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!auth?.token ? (
              <>
                <button onClick={() => navigate("/login")} className="text-[#2C2C2C] hover:text-[#7A9D96] font-semibold transition-colors px-4 py-2 cursor-pointer">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-2.5 rounded-lg hover:shadow-lg font-semibold transition-all cursor-pointer">
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/dashboard")} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#7A9D96]/10 hover:text-[#7A9D96] font-semibold transition-all cursor-pointer">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                {(auth?.user?.role === "Admin" || auth?.user?.role === "SuperVisor") && (
                  <button onClick={() => navigate("/admin")} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#7A9D96]/10 hover:text-[#7A9D96] font-semibold transition-all cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                )}

                <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-all cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-[#2C2C2C] mb-6 leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
                Save Lives Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A9D96] to-[#6A8D86]">Accurate</span> Communication
              </h1>
              <p className="text-xl text-[#6B6B6B] mb-8 leading-relaxed">Become a certified medical interpreter. Bridge language barriers in healthcare and make a real difference in patients' lives while building a secure, AI-proof career.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate(auth?.token ? "/dashboard" : "/register")} className="bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] text-white px-8 py-4 rounded-lg hover:shadow-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 group cursor-pointer">
                  <span>{auth?.token ? "Go to Dashboard" : "Start Your Journey"}</span>
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={() => navigate("/course")} className="border-2 border-[#2C2C2C] text-[#2C2C2C] px-8 py-4 rounded-lg hover:bg-[#2C2C2C] hover:text-white font-bold text-lg transition-all cursor-pointer">
                  Explore Course
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#E8E8E6] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-shadow">
                <img src="/pic1.jpg" alt="Medical interpreter at work" className="w-full h-full object-cover" />

                <div className="absolute inset-0 flex items-center justify-center text-[#6B6B6B] text-lg font-medium p-8 text-center"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-[#E8E8E6]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2C2C2C]">Certified Training</div>
                    <div className="text-xs text-[#6B6B6B]">Professional Standards</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Bar */}
      <section className="py-16 bg-white border-y border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: "$15-25", label: "Hourly Rate", sub: "Industry average" },
              { value: "20%", label: "Job Growth", sub: "Through 2031" },
              { value: "AI-Proof", label: "Career Security", sub: "Cannot be automated" },
              { value: "Dual", label: "Certificates", sub: "Medical + HIPAA" },
            ].map((stat, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                <div className="text-[#2C2C2C] font-bold mb-1">{stat.label}</div>
                <div className="text-sm text-[#6B6B6B]">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      jsx{/* Comprehensive Training Stats */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/10 text-[#7A9D96] px-4 py-2 rounded-full mb-6 border border-[#7A9D96]/20">
              <Award className="w-5 h-5" />
              <span className="font-bold text-sm">Comprehensive Curriculum</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
              Real Training, Real Results
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-3xl mx-auto leading-relaxed">This isn't a superficial course. You'll complete rigorous training with hundreds of practice questions to ensure you're truly prepared for the field.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* IMAGE - LEFT SIDE */}
            <div className="order-2 md:order-1 relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#E8E8E6] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="picpic2.webp" alt="Comprehensive training and practice" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-[#E8E8E6]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7A9D96]/20 to-[#6A8D86]/20 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#7A9D96]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2C2C2C]">Intensive Training</div>
                    <div className="text-xs text-[#6B6B6B]">Real-world readiness</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT - RIGHT SIDE */}
            <div className="order-1 md:order-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all cursor-default">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] bg-clip-text text-transparent mb-2">10</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">Chapters</div>
                  <div className="text-sm text-[#6B6B6B]">Structured learning path</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all cursor-default">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] bg-clip-text text-transparent mb-2">63</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">Lessons</div>
                  <div className="text-sm text-[#6B6B6B]">In-depth content</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all cursor-default">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] bg-clip-text text-transparent mb-2">1000+</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">Questions</div>
                  <div className="text-sm text-[#6B6B6B]">Practice & mastery</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E8E8E6] hover:border-[#7A9D96] transition-all cursor-default">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] bg-clip-text text-transparent mb-2">500+</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">MCQs</div>
                  <div className="text-sm text-[#6B6B6B]">To complete course</div>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-br from-[#7A9D96]/5 to-[#6A8D86]/5 p-6 rounded-xl border-2 border-[#7A9D96]/20">
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                  By Course Completion, You Will Have:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#7A9D96] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Answered 500+ multiple choice questions</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#7A9D96] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Mastered medical terminology across 10 chapters</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#7A9D96] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Completed intensive practical assessments</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#7A9D96] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Proven your skills through rigorous testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 1: Life & Death Stakes */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/10 text-[#7A9D96] px-4 py-2 rounded-full mb-6 border border-[#7A9D96]/20">
                <Shield className="w-5 h-5" />
                <span className="font-bold text-sm">Critical Importance</span>
              </div>
              <h2 className="text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Untrained Interpreters Can Cost Lives
              </h2>
              <p className="text-lg text-[#6B6B6B] mb-6 leading-relaxed">60% of medical diagnoses depend on patient interviews. When communication breaks down, patients receive wrong medications, undergo unnecessary procedures, or have critical conditions go undiagnosed.</p>
              <ul className="space-y-4">
                {["Family members breach confidentiality", "Google Translate misses medical context", "Bilingual staff lack medical terminology", "Errors lead to real patient harm"].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 group">
                    <CheckCircle className="w-6 h-6 text-[#7A9D96] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[#2C2C2C] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#E8E8E6] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic2.jpg" alt="Risks of untrained interpretation" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 2: Career & Pay */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="aspect-square bg-gradient-to-br from-[#E8E8E6] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic3.jpeg" alt="Career growth and income" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/10 text-[#7A9D96] px-4 py-2 rounded-full mb-6 border border-[#7A9D96]/20">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold text-sm">Growing Demand</span>
              </div>
              <h2 className="text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Excellent Pay in a Secure, AI-Proof Field
              </h2>
              <p className="text-lg text-[#6B6B6B] mb-6 leading-relaxed">Medical interpreters earn $25-$45 per hour with consistent demand. Unlike many careers, this role requires human judgment, cultural understanding, and empathy that AI cannot replicate.</p>
              <div className="space-y-6">
                {[
                  { icon: TrendingUp, title: "High Earning Potential", desc: "Average $60,000-$90,000 annually with flexible scheduling" },
                  { icon: Shield, title: "AI Cannot Replace You", desc: "Machines can't read emotions, cultural context, or handle nuance" },
                  { icon: Award, title: "Federal Law Requirement", desc: "Hospitals must provide interpreters - your job is protected" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4 group">
                    <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6 text-[#7A9D96]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">{item.title}</h3>
                      <p className="text-[#6B6B6B]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 3: Course Quality */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/10 text-[#7A9D96] px-4 py-2 rounded-full mb-6 border border-[#7A9D96]/20">
                <Award className="w-5 h-5" />
                <span className="font-bold text-sm">Certification Program</span>
              </div>
              <h2 className="text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Earn a Certificate That Actually Means Something
              </h2>
              <p className="text-lg text-[#6B6B6B] mb-6 leading-relaxed">This isn't a "watch videos and get certified" course. You must pass quizzes after each lesson, chapter tests with cooldowns, and a comprehensive final exam to earn your dual certificates.</p>
              <div className="space-y-4 bg-gradient-to-br from-[#7A9D96]/5 to-[#6A8D86]/5 p-6 rounded-xl border-2 border-[#7A9D96]/20">
                {[
                  { icon: BookOpen, text: "Lesson quizzes: 80% to pass, unlimited attempts" },
                  { icon: Target, text: "Chapter tests: 70% to pass, 3-hour cooldown" },
                  { icon: Award, text: "Final exam: 80% to pass, 24-hour cooldown" },
                  { icon: CheckCircle, text: "Two certificates: Medical + HIPAA" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 group">
                    <item.icon className="w-5 h-5 text-[#7A9D96] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[#2C2C2C]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#E8E8E6] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic4.jpg" alt="Professional certificates" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Coming Soon: Audio Practice */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#7A9D96]/5 to-[#6A8D86]/5 rounded-3xl p-12 md:p-16 border-2 border-[#7A9D96]/20 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#7A9D96]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#6A8D86]/10 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              {/* IMAGE - LEFT SIDE */}
              <div className="order-2 md:order-1 relative">
                <div className="aspect-square bg-gradient-to-br from-[#E8E8E6] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/picpic3.jpg" alt="Audio practice training coming soon" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#7A9D96]/20 to-transparent rounded-2xl"></div>
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-xl">🎙️</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#2C2C2C]">In Development</div>
                      <div className="text-xs text-[#6B6B6B]">Stay tuned for updates</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TEXT - RIGHT SIDE */}
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-4 py-2 rounded-full mb-6">
                  <span className="font-bold text-sm">🎧 COMING SOON</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Audio Practice Module
                </h2>
                <p className="text-xl text-[#6B6B6B] mb-6 leading-relaxed">Real-world interpreting isn't just about reading it's about listening and responding in real-time. We're developing an immersive audio practice system to prepare you for actual patient encounters.</p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white p-3 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                      <CheckCircle className="w-6 h-6 text-[#7A9D96]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">Simulated Patient Conversations</h3>
                      <p className="text-[#6B6B6B] text-sm">Practice interpreting realistic medical dialogues</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white p-3 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                      <CheckCircle className="w-6 h-6 text-[#7A9D96]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">Multiple Accents & Dialects</h3>
                      <p className="text-[#6B6B6B] text-sm">Prepare for diverse patient populations</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white p-3 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                      <CheckCircle className="w-6 h-6 text-[#7A9D96]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">Speed & Accuracy Training</h3>
                      <p className="text-[#6B6B6B] text-sm">Build the skills hospitals demand</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-[#7A9D96]/30">
                  <p className="text-sm text-[#6B6B6B]">
                    <span className="font-semibold text-[#7A9D96]">✨ Early Access:</span> Current students will get free access when this feature launches!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#7A9D96] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#6A8D86] rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
            Start Your Career Today
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">Join students building meaningful careers while making a real difference in healthcare communication.</p>
          <button onClick={() => navigate(auth?.token ? "/dashboard" : "/register")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-12 py-5 rounded-lg hover:shadow-2xl font-bold text-lg transition-all inline-flex items-center space-x-3 group cursor-pointer">
            <span>{auth?.token ? "Continue Learning" : "Enroll Now"}</span>
            <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <p className="text-gray-400 mt-6 text-sm">100% online • Self-paced • Dual certification</p>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-8 h-8 text-[#7A9D96]" />
                <span className="text-white font-bold text-lg" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Medical Interpreter Academy
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">Professional medical interpreter training and certification platform.</p>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-[#7A9D96]" />
                <a href="mailto:support@medicalinterpreteracademy.com" className="hover:text-[#7A9D96] transition-colors">
                  support@medicalinterpreteracademy.com
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/course" className="hover:text-[#7A9D96] transition-colors flex items-center space-x-2">
                    <span>View Course</span>
                  </a>
                </li>
                <li>
                  <a href="/register" className="hover:text-[#7A9D96] transition-colors flex items-center space-x-2">
                    <span>Get Started</span>
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-[#7A9D96] transition-colors flex items-center space-x-2">
                    <span>Login</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                Resources
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="https://www.bls.gov/ooh/media-and-communication/interpreters-and-translators.htm" target="_blank" rel="noopener noreferrer" className="hover:text-[#7A9D96] transition-colors">
                    Career Outlook (BLS)
                  </a>
                </li>
                <li>
                  <a href="https://www.healthaffairs.org/do/10.1377/forefront.20081119.000463/" target="_blank" rel="noopener noreferrer" className="hover:text-[#7A9D96] transition-colors">
                    Willie Ramirez Case Study
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="hover:text-[#7A9D96] transition-colors cursor-pointer">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="hover:text-[#7A9D96] transition-colors cursor-pointer">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 Medical Interpreter Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
