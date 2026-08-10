import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { courseAPI } from "../services/api";
import { CheckCircle, Award, BookOpen, Clock, TrendingUp, ChevronRight, Star, Globe, Headphones, FileText, Shield, Briefcase, Library } from "lucide-react";
import Layout from "../components/Layout";

interface Lesson {
  _id: string;
  title: string;
  lessonNumber: number;
}

interface Chapter {
  _id: string;
  title: string;
  description: string;
  chapterNumber: number;
  lessons: Lesson[];
}

// Accordion Component
function ChapterAccordion({ chapter }: { chapter: Chapter }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#E5E5E3] rounded-lg overflow-hidden hover:border-[#1B3A5C] transition-colors">
      {/* Chapter Header - Clickable */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-white hover:bg-[#F7F7F5] transition-colors text-left">
        <div className="flex items-center space-x-4 flex-1">
          <div className="bg-gradient-to-br from-[#1B3A5C] to-[#3B6EA5] text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0">{chapter.chapterNumber}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#1A1A1A]">{chapter.title}</h3>
            <p className="text-sm text-[#5A5A5A] mt-1">
              {chapter.lessons?.length || 0} {chapter.lessons?.length === 1 ? "lesson" : "lessons"}
            </p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-[#1B3A5C] transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {/* Lessons - Expandable */}
      {isOpen && chapter.lessons && chapter.lessons.length > 0 && (
        <div className="bg-[#F7F7F5] border-t border-[#E5E5E3]">
          {chapter.lessons.map((lesson) => (
            <div key={lesson._id} className="flex items-center space-x-3 px-4 py-3 border-b border-[#E5E5E3] last:border-b-0 hover:bg-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#1B3A5C]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#1B3A5C]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Lesson {lesson.lessonNumber}: {lesson.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Lessons Message */}
      {isOpen && (!chapter.lessons || chapter.lessons.length === 0) && (
        <div className="bg-[#F7F7F5] border-t border-[#E5E5E3] px-4 py-3">
          <p className="text-sm text-[#5A5A5A] italic">No lessons available yet</p>
        </div>
      )}
    </div>
  );
}

function CourseDetail() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const COURSE_ID = import.meta.env.VITE_COURSE_ID;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getCourse(COURSE_ID);
        setChapters(response.data.course.chapters);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, []);

  // Students, Admins, and SuperVisors have course access; a plain "User" has
  // registered but not purchased, so they get sent to the purchase flow instead.
  const role = auth?.user?.role;
  const hasCourseAccess = role === "Student" || role === "Admin" || role === "SuperVisor";
  const ctaLabel = !auth?.token ? "Enroll Now" : hasCourseAccess ? "Go to Dashboard" : "Buy the Course";

  const handleEnroll = () => {
    if (!auth?.token) {
      navigate("/register");
    } else if (hasCourseAccess) {
      navigate("/dashboard");
    } else {
      navigate("/purchase");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A5C] mx-auto mb-4"></div>
            <p className="text-[#5A5A5A]">Loading course details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#F7F7F5]">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#1B3A5C] to-[#3B6EA5] text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 relative z-10">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-yellow-300" fill="currentColor" />
                <span className="text-sm font-semibold">Professional Certification Program</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
                Medical Interpreter Certification Course
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 leading-relaxed mb-8">Master the skills needed to become a certified medical interpreter and launch your career in healthcare communication</p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">{chapters.length} Chapters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">2 Certificates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Self-Paced</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">100% Online</span>
                </div>
              </div>

              <button onClick={handleEnroll} className="bg-white text-[#1B3A5C] px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2 group">
                <span>{ctaLabel}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-white rounded-2xl shadow-md p-8 border border-[#E5E5E3]">
                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                  About This Course
                </h2>
                <p className="text-[#5A5A5A] leading-relaxed text-lg mb-8">This comprehensive medical interpretation course prepares you for a rewarding career in healthcare communication. You'll learn essential skills, terminology, and ethical practices required to bridge language barriers in medical settings.</p>

                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">What You'll Learn</h3>
                <div className="space-y-3 mb-8">
                  {["The role and responsibilities of a medical interpreter", "Differences between translation and interpretation", "Working in different healthcare settings (on-site, phone, video)", "Consecutive and simultaneous interpreting techniques", "The critical importance of accuracy in healthcare", "HIPAA compliance and patient confidentiality"].map((item, index) => (
                    <div key={index} className="flex items-start group">
                      <div className="bg-gradient-to-br from-[#1B3A5C] to-[#3B6EA5] rounded-full p-1 mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-[#1A1A1A]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters List - Accordion */}
              <div className="bg-white rounded-2xl shadow-md p-8 border border-[#E5E5E3]">
                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Course Curriculum
                </h2>
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <ChapterAccordion key={chapter._id} chapter={chapter} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Enrollment Card */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E5E5E3]">
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-6">Features</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                        <BookOpen className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{chapters.length} Chapters</p>
                        <p className="text-sm text-[#5A5A5A]">Comprehensive content</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                        <FileText className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">Interactive Quizzes</p>
                        <p className="text-sm text-[#5A5A5A]">Test your knowledge</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                        <Award className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">2 Certificates</p>
                        <p className="text-sm text-[#5A5A5A]">Medical + HIPAA</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2">
                        <Headphones className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">Lifetime Access</p>
                        <p className="text-sm text-[#5A5A5A]">Learn at your pace</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleEnroll} className="w-full bg-gradient-to-r from-[#1B3A5C] to-[#3B6EA5] text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2 group">
                    <span>{ctaLabel}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Post-Course Services */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E5E5E3]">
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-1">Post-Course Services</h3>
                  <p className="text-sm text-[#5A5A5A] mb-6">Available as an add-on after course purchase.</p>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2 flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1A1A1A]">CV & Career Subscription</p>
                          <span className="text-xs font-bold text-[#1B3A5C] bg-[#1B3A5C]/10 border border-[#1B3A5C]/20 px-2 py-0.5 rounded-full whitespace-nowrap">Coming soon</span>
                        </div>
                        <p className="text-sm text-[#5A5A5A] mt-0.5">Ongoing CV updates and curated job postings</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2 flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1A1A1A]">Interpreter Handbook</p>
                          <span className="text-xs font-bold text-[#1B3A5C] bg-[#1B3A5C]/10 border border-[#1B3A5C]/20 px-2 py-0.5 rounded-full whitespace-nowrap">Coming soon</span>
                        </div>
                        <p className="text-sm text-[#5A5A5A] mt-0.5">Real-world scenario reference guide</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#1B3A5C]/10 rounded-lg p-2 flex-shrink-0">
                        <Library className="w-5 h-5 text-[#1B3A5C]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1A1A1A]">Specialized Glossaries</p>
                          <span className="text-xs font-bold text-[#1B3A5C] bg-[#1B3A5C]/10 border border-[#1B3A5C]/20 px-2 py-0.5 rounded-full whitespace-nowrap">Coming soon</span>
                        </div>
                        <p className="text-sm text-[#5A5A5A] mt-0.5">US/Canadian medical abbreviation glossary books</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Career Stats */}
                <div className="bg-gradient-to-br from-[#1B3A5C] to-[#3B6EA5] text-white rounded-2xl shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Career Outlook</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Average Salary</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold">$10-25/hour</p>
                    </div>
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Job Growth</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold">20% by 2031</p>
                    </div>
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Career Security</span>
                        <Shield className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-bold">AI-Proof</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CourseDetail;
