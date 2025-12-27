import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, TrendingUp, Award, CheckCircle, BookOpen, Target } from "lucide-react";
import UserMenu from "../components/UserMenu";

function Landing() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  // Show loading spinner while checking auth
  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-xl text-[#6B6B6B]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="flex items-center space-x-3 cursor-pointer">
            <Shield className="w-8 h-8 text-[#7A9D96]" strokeWidth={2} />
            <span className="text-xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Inter, sans-serif" }}>
              Medical Interpreter Academy
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {!auth?.token ? (
              <>
                <button onClick={() => navigate("/login")} className="text-[#2C2C2C] hover:text-[#7A9D96] font-semibold transition-colors">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="bg-[#7A9D96] text-white px-6 py-2.5 rounded-lg hover:bg-[#6A8D86] font-semibold transition-all shadow-sm hover:shadow-md">
                  Get Started
                </button>
              </>
            ) : (
              <UserMenu userName={auth.user?.name || "User"} onLogout={auth.logout} />
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-[#2C2C2C] mb-6 leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Save Lives Through <span className="text-[#7A9D96]">Accurate</span> Communication
              </h1>
              <p className="text-xl text-[#6B6B6B] mb-8 leading-relaxed">Become a certified medical interpreter. Bridge language barriers in healthcare and make a real difference in patients' lives while building a secure, AI-proof career.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate(auth?.token ? "/dashboard" : "/register")} className="bg-[#2C2C2C] text-white px-8 py-4 rounded-lg hover:bg-[#1A1A1A] font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                  <span>{auth?.token ? "Go to Dashboard" : "Start Your Journey"}</span>
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={() => navigate("/course")} className="border-2 border-[#2C2C2C] text-[#2C2C2C] px-8 py-4 rounded-lg hover:bg-[#2C2C2C] hover:text-white font-semibold transition-all">
                  Explore Course
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-[#E8E8E6] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/hero-image.jpg" alt="Medical interpreter at work" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center text-[#6B6B6B] text-lg font-medium bg-[#E8E8E6]">Hero Image: Medical Interpreter</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-y border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#7A9D96] mb-2">$25-45</div>
              <div className="text-[#6B6B6B] font-medium">Hourly Rate</div>
              <div className="text-sm text-[#6B6B6B]/70 mt-1">Industry average</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7A9D96] mb-2">Growing</div>
              <div className="text-[#6B6B6B] font-medium">Job Market</div>
              <div className="text-sm text-[#6B6B6B]/70 mt-1">High demand field</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7A9D96] mb-2">AI-Proof</div>
              <div className="text-[#6B6B6B] font-medium">Career Security</div>
              <div className="text-sm text-[#6B6B6B]/70 mt-1">Cannot be automated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7A9D96] mb-2">2</div>
              <div className="text-[#6B6B6B] font-medium">Certificates</div>
              <div className="text-sm text-[#6B6B6B]/70 mt-1">Main + HIPAA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Life & Death Stakes */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-full mb-6">
                <Shield className="w-5 h-5" />
                <span className="font-semibold text-sm">Critical Importance</span>
              </div>
              <h2 className="text-4xl font-bold text-[#2C2C2C] mb-6">Untrained Interpreters Can Cost Lives</h2>
              <p className="text-lg text-[#6B6B6B] mb-6 leading-relaxed">60% of medical diagnoses depend on patient interviews. When communication breaks down, patients receive wrong medications, undergo unnecessary procedures, or have critical conditions go undiagnosed.</p>
              <ul className="space-y-4">
                {["Family members breach confidentiality", "Google Translate misses medical context", "Bilingual staff lack medical terminology", "Errors lead to real patient harm"].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#7A9D96] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2C2C2C] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-[#E8E8E6] rounded-2xl overflow-hidden shadow-xl">
                <img src="/untrained-risks.jpg" alt="Risks of untrained interpretation" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center text-[#6B6B6B] text-lg font-medium bg-[#E8E8E6]">Image: Medical Error Impact</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Career & Pay */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="aspect-square bg-[#E8E8E6] rounded-2xl overflow-hidden shadow-xl">
                <img src="/career-growth.jpg" alt="Career growth and income" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center text-[#6B6B6B] text-lg font-medium bg-[#E8E8E6]">Image: Career Success</div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mb-6">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold text-sm">Growing Demand</span>
              </div>
              <h2 className="text-4xl font-bold text-[#2C2C2C] mb-6">Excellent Pay in a Secure, AI-Proof Field</h2>
              <p className="text-lg text-[#6B6B6B] mb-6 leading-relaxed">Medical interpreters earn $25-$45 per hour with consistent demand. Unlike many careers, this role requires human judgment, cultural understanding, and empathy that AI cannot replicate.</p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#7A9D96]/10 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-[#7A9D96]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2C2C2C] mb-1">High Earning Potential</h3>
                    <p className="text-[#6B6B6B]">Average $60,000-$90,000 annually with flexible scheduling</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#7A9D96]/10 p-3 rounded-lg">
                    <Shield className="w-6 h-6 text-[#7A9D96]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2C2C2C] mb-1">AI Cannot Replace You</h3>
                    <p className="text-[#6B6B6B]">Machines can't read emotions, cultural context, or handle nuance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#7A9D96]/10 p-3 rounded-lg">
                    <Award className="w-6 h-6 text-[#7A9D96]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2C2C2C] mb-1">Federal Law Requirement</h3>
                    <p className="text-[#6B6B6B]">Hospitals must provide interpreters - your job is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Course Quality */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6">
                <Award className="w-5 h-5" />
                <span className="font-semibold text-sm">Certification Program</span>
              </div>
              <h2 className="text-4xl font-bold text-[#2C2C2C] mb-6">Earn a Certificate That Actually Means Something</h2>
              <p className="text-lg text-[#6B6B6B] mb-6 leading-relaxed">This isn't a "watch videos and get certified" course. You must pass quizzes after each lesson, chapter tests with cooldowns, and a comprehensive final exam to earn your dual certificates.</p>
              <div className="space-y-4 bg-[#7A9D96]/5 p-6 rounded-xl border border-[#7A9D96]/20">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-[#7A9D96]" />
                  <span className="font-semibold text-[#2C2C2C]">Lesson quizzes: 80% to pass, unlimited attempts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-[#7A9D96]" />
                  <span className="font-semibold text-[#2C2C2C]">Chapter tests: 70% to pass, 3-hour cooldown</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-[#7A9D96]" />
                  <span className="font-semibold text-[#2C2C2C]">Final exam: 80% to pass, 24-hour cooldown</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[#7A9D96]" />
                  <span className="font-semibold text-[#2C2C2C]">Two certificates: Medical + HIPAA</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-[#E8E8E6] rounded-2xl overflow-hidden shadow-xl">
                <img src="/certificates.jpg" alt="Professional certificates" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center text-[#6B6B6B] text-lg font-medium bg-[#E8E8E6]">Image: Dual Certificates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-[#2C2C2C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Start Your Career Today</h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">Join students building meaningful careers while making a real difference in healthcare communication.</p>
          <button onClick={() => navigate(auth?.token ? "/dashboard" : "/register")} className="bg-[#7A9D96] text-white px-12 py-5 rounded-lg hover:bg-[#6A8D86] font-bold text-lg transition-all shadow-2xl hover:shadow-3xl inline-flex items-center space-x-3">
            <span>{auth?.token ? "Continue Learning" : "Enroll Now"}</span>
            <CheckCircle className="w-6 h-6" />
          </button>
          <p className="text-gray-400 mt-6 text-sm">100% online • Self-paced • Dual certification</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-gray-400">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-8 h-8 text-[#7A9D96]" />
                <span className="text-white font-bold text-lg">Medical Interpreter Academy</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Professional medical interpreter training and certification platform.</p>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7A9D96] transition-colors">
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 Medical Interpreter Academy. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-[#7A9D96] transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#7A9D96] transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#7A9D96] transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
