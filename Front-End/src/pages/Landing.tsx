import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, TrendingUp, Award, CheckCircle, BookOpen, Target, LogOut, LayoutDashboard, Settings, Mail, Briefcase, FileText, Sparkles, ShoppingCart, Headphones, Library } from "lucide-react";

// Non-sticky strip shown to registered-but-not-purchased users (role "User"),
// sitting between the nav and the marketing page.
function PurchaseBanner({ onBuy }: { onBuy: () => void }) {
  return (
    <div className="bg-[#1B3A5C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <ShoppingCart className="w-5 h-5 text-white/80 hidden sm:block flex-shrink-0" />
          <p className="font-semibold">You're registered — complete your enrollment to start the course</p>
        </div>
        <button onClick={onBuy} className="bg-white text-[#1B3A5C] px-6 py-2.5 rounded-lg font-bold hover:shadow-lg transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer">
          <ShoppingCart className="w-4 h-4" />
          <span>Buy the Course</span>
        </button>
      </div>
    </div>
  );
}

// Condensed "welcome back" view shown to users who already have course access
// (role Student/Admin/SuperVisor) in place of the full marketing page.
function CondensedWelcome({ name, onContinue }: { name?: string; onContinue: () => void }) {
  const comingSoon = [
    { icon: Headphones, title: "Audio Practice Module", desc: "Immersive listen-and-respond practice with simulated patient conversations." },
    { icon: Briefcase, title: "CV & Career Subscription", desc: "Ongoing CV updates and curated interpreter job postings." },
    { icon: BookOpen, title: "Interpreter Handbook", desc: "A real-world scenario reference guide for the job." },
    { icon: Library, title: "Specialized Glossaries", desc: "US/Canadian medical abbreviation glossary books." },
  ];

  return (
    <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-white to-[#F7F7F5]">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-4 py-2 rounded-full mb-6 border border-[#1B3A5C]/20">
          <Award className="w-5 h-5" />
          <span className="font-bold text-sm">You're enrolled</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2C2C2C] mb-4 leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
          Welcome back{name ? `, ${name}` : ""}
        </h1>
        <p className="text-lg md:text-xl text-[#5A5A5A] mb-8 leading-relaxed max-w-2xl mx-auto">Pick up right where you left off and keep progressing toward your certification.</p>
        <button onClick={onContinue} className="bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-10 py-4 rounded-lg hover:shadow-2xl font-bold text-lg transition-all inline-flex items-center space-x-2 group cursor-pointer">
          <span>Continue Learning</span>
          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* What's Coming strip */}
      <div className="max-w-6xl mx-auto mt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-sm">What's Coming</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
            New features & services in development
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comingSoon.map((item, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border-2 border-[#E5E5E3] p-5 hover:shadow-lg hover:border-[#1B3A5C] transition-all">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#1B3A5C]/10 to-[#3B6EA5]/10 flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-[#1B3A5C]" />
              </div>
              <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-2.5 py-0.5 rounded-full mb-2 border border-[#1B3A5C]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-bold text-[11px]">Coming Soon</span>
              </div>
              <h3 className="font-bold text-[#2C2C2C] mb-1" style={{ fontFamily: "Lexend, sans-serif" }}>
                {item.title}
              </h3>
              <p className="text-sm text-[#5A5A5A] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Landing() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A5C]"></div>
      </div>
    );
  }

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
      navigate("/");
    }
  };

  // Students, Admins, and SuperVisors have course access; a plain "User" has
  // registered but not purchased, so they get routed to the purchase flow.
  const role = auth?.user?.role;
  const hasCourseAccess = role === "Student" || role === "Admin" || role === "SuperVisor";
  const isUser = role === "User"; // registered but hasn't purchased
  const heroCtaLabel = !auth?.token ? "Start Your Journey" : hasCourseAccess ? "Go to Dashboard" : "Buy the Course";
  const finalCtaLabel = !auth?.token ? "Enroll Now" : hasCourseAccess ? "Continue Learning" : "Buy the Course";

  const handlePrimaryCta = () => {
    if (!auth?.token) {
      navigate("/register");
    } else if (hasCourseAccess) {
      navigate("/dashboard");
    } else {
      navigate("/purchase");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E5E5E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-2">
          <button onClick={() => navigate("/")} className="flex items-center space-x-3 cursor-pointer group shrink-0">
            {/* Mobile: M.I.A */}
            <span className="md:hidden text-lg sm:text-xl font-bold text-[#1B3A5C] group-hover:scale-105 transition-transform" style={{ fontFamily: "Lexend, sans-serif" }}>
              M.I.A
            </span>
            {/* Desktop: Full name */}
            <span className="hidden md:block text-xl font-bold text-[#1B3A5C] group-hover:scale-105 transition-transform" style={{ fontFamily: "Lexend, sans-serif" }}>
              Medical Interpreter Academy
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            {!auth?.token ? (
              <>
                <button onClick={() => navigate("/login")} className="text-[#2C2C2C] hover:text-[#1B3A5C] font-semibold transition-colors px-3 sm:px-4 py-2 cursor-pointer">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-4 sm:px-6 py-2.5 rounded-lg hover:shadow-lg font-semibold transition-all cursor-pointer whitespace-nowrap">
                  Get Started
                </button>
              </>
            ) : (
              <>
                {hasCourseAccess ? (
                  <button onClick={() => navigate("/dashboard")} className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#1B3A5C]/10 hover:text-[#1B3A5C] font-semibold transition-all cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                ) : (
                  <button onClick={() => navigate("/purchase")} className="flex items-center gap-2 bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-4 sm:px-6 py-2.5 rounded-lg hover:shadow-lg font-semibold transition-all cursor-pointer whitespace-nowrap">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy the Course</span>
                  </button>
                )}

                {(auth?.user?.role === "Admin" || auth?.user?.role === "SuperVisor") && (
                  <button onClick={() => navigate("/admin")} className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-[#2C2C2C] hover:bg-[#1B3A5C]/10 hover:text-[#1B3A5C] font-semibold transition-all cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}

                <button onClick={handleLogout} className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-all cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {hasCourseAccess ? (
        /* Users with course access get a condensed welcome-back view instead of the marketing page. */
        <CondensedWelcome name={auth?.user?.name} onContinue={() => navigate("/dashboard")} />
      ) : (
        <>
          {/* Role "User" (registered, not purchased) sees a purchase reminder above the full page. */}
          {isUser && <PurchaseBanner onBuy={() => navigate("/purchase")} />}
      {/* Hero Section */}
      <section className="py-12 md:py-24 px-6 bg-gradient-to-b from-white to-[#F7F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2C2C2C] mb-6 leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
                Save Lives Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5]">Accurate</span> Communication
              </h1>
              <p className="text-lg md:text-xl text-[#5A5A5A] mb-8 leading-relaxed">Become a certified medical interpreter. Bridge language barriers in healthcare and make a real difference in patients' lives while building a secure, AI-proof career.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handlePrimaryCta} className="bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] text-white px-8 py-4 rounded-lg hover:shadow-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 group cursor-pointer">
                  <span>{heroCtaLabel}</span>
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={() => navigate("/course")} className="border-2 border-[#2C2C2C] text-[#2C2C2C] px-8 py-4 rounded-lg hover:bg-[#2C2C2C] hover:text-white font-bold text-lg transition-all cursor-pointer">
                  Explore Course
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-shadow">
                <img src="/pic1.jpg" alt="Medical interpreter at work" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-[#E5E5E3]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#1B3A5C]/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-[#1B3A5C]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2C2C2C]">Certified Training</div>
                    <div className="text-xs text-[#5A5A5A]">Professional Standards</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Bar */}
      <section className="py-12 md:py-16 bg-white border-y border-[#E5E5E3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "$10-25", label: "Hourly Rate", sub: "Industry average" },
              { value: "20%", label: "Job Growth", sub: "Through 2031" },
              { value: "AI-Proof", label: "Career Security", sub: "Cannot be automated" },
              { value: "Dual", label: "Certificates", sub: "Medical + HIPAA" },
            ].map((stat, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                <div className="text-[#2C2C2C] font-bold mb-1">{stat.label}</div>
                <div className="text-sm text-[#5A5A5A]">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-white to-[#F7F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-4 py-2 rounded-full mb-6 border border-[#1B3A5C]/20">
              <Award className="w-5 h-5" />
              <span className="font-bold text-sm">Comprehensive Curriculum</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
              Real Training, Real Results
            </h2>
            <p className="text-lg md:text-xl text-[#5A5A5A] max-w-3xl mx-auto leading-relaxed">This isn't a superficial course. You'll complete rigorous training with hundreds of practice questions to ensure you're truly prepared for the field.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            {/* IMAGE - LEFT SIDE */}
            <div className="order-2 md:order-1 relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/picpic2.webp" alt="Comprehensive training and practice" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-[#E5E5E3]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1B3A5C]/20 to-[#3B6EA5]/20 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#1B3A5C]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2C2C2C]">Intensive Training</div>
                    <div className="text-xs text-[#5A5A5A]">Real-world readiness</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT - RIGHT SIDE */}
            <div className="order-1 md:order-2">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E5E5E3] hover:border-[#1B3A5C] transition-all cursor-default">
                  <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] bg-clip-text text-transparent mb-2">10</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">Chapters</div>
                  <div className="text-sm text-[#5A5A5A]">Structured learning path</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E5E5E3] hover:border-[#1B3A5C] transition-all cursor-default">
                  <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] bg-clip-text text-transparent mb-2">63</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">Lessons</div>
                  <div className="text-sm text-[#5A5A5A]">In-depth content</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E5E5E3] hover:border-[#1B3A5C] transition-all cursor-default">
                  <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] bg-clip-text text-transparent mb-2">1000+</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">Questions</div>
                  <div className="text-sm text-[#5A5A5A]">Practice & mastery</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#E5E5E3] hover:border-[#1B3A5C] transition-all cursor-default">
                  <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] bg-clip-text text-transparent mb-2">500+</div>
                  <div className="text-[#2C2C2C] font-bold mb-1">MCQs</div>
                  <div className="text-sm text-[#5A5A5A]">To complete course</div>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-br from-[#1B3A5C]/5 to-[#3B6EA5]/5 p-6 rounded-xl border-2 border-[#1B3A5C]/20">
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
                  By Course Completion, You Will Have:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Answered 500+ multiple choice questions</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Mastered medical terminology across 10 chapters</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Completed intensive practical assessments</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">Proven your skills through rigorous testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 1: Life & Death Stakes */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-4 py-2 rounded-full mb-6 border border-[#1B3A5C]/20">
                <Shield className="w-5 h-5" />
                <span className="font-bold text-sm">Critical Importance</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Untrained Interpreters Can Cost Lives
              </h2>
              <p className="text-base md:text-lg text-[#5A5A5A] mb-6 leading-relaxed">60% of medical diagnoses depend on patient interviews. When communication breaks down, patients receive wrong medications, undergo unnecessary procedures, or have critical conditions go undiagnosed.</p>
              <ul className="space-y-4">
                {["Family members breach confidentiality", "Google Translate misses medical context", "Bilingual staff lack medical terminology", "Errors lead to real patient harm"].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 group">
                    <CheckCircle className="w-6 h-6 text-[#1B3A5C] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[#2C2C2C] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic2.jpg" alt="Risks of untrained interpretation" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 2: Career & Pay */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-white to-[#F7F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="aspect-square bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic3.jpeg" alt="Career growth and income" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-4 py-2 rounded-full mb-6 border border-[#1B3A5C]/20">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold text-sm">Growing Demand</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Excellent Pay in a Secure, AI-Proof Field
              </h2>
              <p className="text-base md:text-lg text-[#5A5A5A] mb-6 leading-relaxed">Medical interpreters earn $10-$25 per hour with consistent demand. Unlike many careers, this role requires human judgment, cultural understanding, and empathy that AI cannot replicate.</p>
              <div className="space-y-6">
                {[
                  { icon: TrendingUp, title: "High Earning Potential", desc: "Average $20,000-$50,000 annually with flexible scheduling" },
                  { icon: Shield, title: "AI Cannot Replace You", desc: "Machines can't read emotions, cultural context, or handle nuance" },
                  { icon: Award, title: "Federal Law Requirement", desc: "Hospitals must provide interpreters - your job is protected" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4 group">
                    <div className="bg-gradient-to-br from-[#1B3A5C]/10 to-[#3B6EA5]/10 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6 text-[#1B3A5C]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">{item.title}</h3>
                      <p className="text-[#5A5A5A]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 3: Course Quality */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-4 py-2 rounded-full mb-6 border border-[#1B3A5C]/20">
                <Award className="w-5 h-5" />
                <span className="font-bold text-sm">Certification Program</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Earn a Certificate That Actually Means Something
              </h2>
              <p className="text-base md:text-lg text-[#5A5A5A] mb-6 leading-relaxed">This isn't a "watch videos and get certified" course. You must pass quizzes after each lesson, chapter tests with cooldowns, and a comprehensive final exam to earn your dual certificates.</p>
              <div className="space-y-4 bg-gradient-to-br from-[#1B3A5C]/5 to-[#3B6EA5]/5 p-6 rounded-xl border-2 border-[#1B3A5C]/20">
                {[
                  { icon: BookOpen, text: "Lesson quizzes: 80% to pass, unlimited attempts" },
                  { icon: Target, text: "Chapter tests: 70% to pass, 3-hour cooldown" },
                  { icon: Award, text: "Final exam: 80% to pass, 24-hour cooldown" },
                  { icon: CheckCircle, text: "Two certificates: Medical + HIPAA" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 group">
                    <item.icon className="w-5 h-5 text-[#1B3A5C] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[#2C2C2C]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic4.jpg" alt="Professional certificates" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature 4: Career Support After Certification */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* IMAGE - LEFT SIDE */}
            <div className="order-2 md:order-1 relative">
              <div className="aspect-square bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/pic5.webp" alt="Career support and job placement guidance" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-[#E5E5E3]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1B3A5C]/20 to-[#3B6EA5]/20 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#1B3A5C]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2C2C2C]">Get Hired</div>
                    <div className="text-xs text-[#5A5A5A]">Guidance beyond the exam</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT - RIGHT SIDE */}
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-4 py-2 rounded-full mb-6 border border-[#1B3A5C]/20">
                <Briefcase className="w-5 h-5" />
                <span className="font-bold text-sm">Career Launch</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                Your Career Doesn't End at Certification
              </h2>
              <p className="text-base md:text-lg text-[#5A5A5A] mb-6 leading-relaxed">A certificate is only the beginning. We give graduates real guidance on actually getting hired not just a PDF to file away. You'll learn how to set yourself up as a working interpreter, how to apply for interpreter jobs, and how to build a resume that speaks the language of this field.</p>
              <ul className="space-y-4">
                {["Step-by-step job application guidance", "How to set up your interpreter career from day one", "CV/resume writing tailored to medical interpreting roles"].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 group">
                    <CheckCircle className="w-6 h-6 text-[#1B3A5C] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[#2C2C2C] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Coming Soon: Audio Practice */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#1B3A5C]/5 to-[#3B6EA5]/5 rounded-3xl p-8 sm:p-12 md:p-16 border-2 border-[#1B3A5C]/20 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1B3A5C]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#3B6EA5]/10 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
              {/* IMAGE - LEFT SIDE */}
              <div className="order-2 md:order-1 relative">
                <div className="aspect-square bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/picpic3.jpg" alt="Audio practice training coming soon" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A5C]/20 to-transparent rounded-2xl"></div>
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1B3A5C] to-[#3B6EA5] rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-xl" aria-hidden="true">🎙️</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#2C2C2C]">In Development</div>
                      <div className="text-xs text-[#5A5A5A]">Stay tuned for updates</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TEXT - RIGHT SIDE */}
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-4 py-2 rounded-full mb-6">
                  <span className="font-bold text-sm"><span aria-hidden="true">🎧</span> COMING SOON</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Audio Practice Module
                </h2>
                <p className="text-lg md:text-xl text-[#5A5A5A] mb-6 leading-relaxed">Real-world interpreting isn't just about reading it's about listening and responding in real-time. We're developing an immersive audio practice system to prepare you for actual patient encounters.</p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white p-3 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                      <CheckCircle className="w-6 h-6 text-[#1B3A5C]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">Simulated Patient Conversations</h3>
                      <p className="text-[#5A5A5A] text-sm">Practice interpreting realistic medical dialogues</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white p-3 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                      <CheckCircle className="w-6 h-6 text-[#1B3A5C]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">Multiple Accents & Dialects</h3>
                      <p className="text-[#5A5A5A] text-sm">Prepare for diverse patient populations</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white p-3 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                      <CheckCircle className="w-6 h-6 text-[#1B3A5C]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C2C2C] mb-1">Speed & Accuracy Training</h3>
                      <p className="text-[#5A5A5A] text-sm">Build the skills hospitals demand</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-[#1B3A5C]/30">
                  <p className="text-sm text-[#5A5A5A]">
                    <span className="font-semibold text-[#1B3A5C]"><span aria-hidden="true">✨</span> Early Access:</span> Current students will get free access when this feature launches!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Coming Soon: More Than a Course */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-white to-[#F7F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-4 py-2 rounded-full mb-6">
              <span className="font-bold text-sm"><span aria-hidden="true">🎧</span> COMING SOON</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
              More Than a Course
            </h2>
            <p className="text-lg md:text-xl text-[#5A5A5A] max-w-3xl mx-auto leading-relaxed">We're building a full support system around your career not just a one-time class. Here's a look at what's currently in development.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: "/smallpic1.webp", alt: "CV and career subscription service", title: "CV & Career Subscription", desc: "An ongoing service where our team helps build and update your CV and shares relevant job postings as they come up." },
              { img: "/smallpic2.webp", alt: "Interpreter handbook reference guide", title: "Interpreter Handbook", desc: "A practical reference guide walking you through the real on-the-job scenarios interpreters face every day." },
              { img: "/smallpic3.webp", alt: "US and Canadian medical abbreviation glossaries", title: "Specialized Glossaries", desc: "Glossary books focused on US and Canadian medical abbreviations, so nothing gets lost in translation." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border-2 border-[#E5E5E3] overflow-hidden group hover:shadow-2xl hover:border-[#1B3A5C] transition-all">
                {/* Full-width banner image */}
                <div className="relative h-40 bg-gradient-to-br from-[#E5E5E3] to-[#D8D8D6] overflow-hidden">
                  <img src={item.img} alt={item.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {/* Subtle scrim so the image ties into the card body below */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/70 to-transparent"></div>
                </div>
                {/* Card body */}
                <div className="p-6">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#1B3A5C]/10 to-[#3B6EA5]/10 text-[#1B3A5C] px-3 py-1 rounded-full mb-4 border border-[#1B3A5C]/20">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold text-xs">In Development</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2C2C2C] mb-3" style={{ fontFamily: "Lexend, sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-[#5A5A5A] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 md:mt-12 max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-[#1B3A5C]/30 text-center">
            <p className="text-sm text-[#5A5A5A]">
              <span className="font-semibold text-[#1B3A5C]"><span aria-hidden="true">✨</span> Heads up:</span> These offerings are upcoming and not yet available. We'll announce each one as it launches.
            </p>
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#1B3A5C] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3B6EA5] rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
            Start Your Career Today
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">Join students building meaningful careers while making a real difference in healthcare communication.</p>
          <button onClick={handlePrimaryCta} className="bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white px-12 py-5 rounded-lg hover:shadow-2xl font-bold text-lg transition-all inline-flex items-center space-x-3 group cursor-pointer">
            <span>{finalCtaLabel}</span>
            <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <p className="text-gray-400 mt-6 text-sm">100% online • Self-paced • Dual certification</p>
        </div>
      </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-8 h-8 text-[#3B6EA5]" />
                <span className="text-white font-bold text-lg" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Medical Interpreter Academy
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">Professional medical interpreter training and certification platform.</p>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-[#3B6EA5]" />
                <a href="mailto:support@medicalinterpreteracademy.com" className="hover:text-[#3B6EA5] transition-colors break-all">
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
                  <a href="/course" className="hover:text-[#3B6EA5] transition-colors flex items-center space-x-2">
                    <span>View Course</span>
                  </a>
                </li>
                <li>
                  <a href="/register" className="hover:text-[#3B6EA5] transition-colors flex items-center space-x-2">
                    <span>Get Started</span>
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-[#3B6EA5] transition-colors flex items-center space-x-2">
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
                  <a href="https://www.bls.gov/ooh/media-and-communication/interpreters-and-translators.htm" target="_blank" rel="noopener noreferrer" className="hover:text-[#3B6EA5] transition-colors">
                    Career Outlook (BLS)
                  </a>
                </li>
                <li>
                  <a href="https://www.healthaffairs.org/do/10.1377/forefront.20081119.000463/" target="_blank" rel="noopener noreferrer" className="hover:text-[#3B6EA5] transition-colors">
                    Willie Ramirez Case Study
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="hover:text-[#3B6EA5] transition-colors cursor-pointer">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="hover:text-[#3B6EA5] transition-colors cursor-pointer">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Medical Interpreter Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
