import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { courseAPI } from "../services/api";
import { CheckCircle, Award, BookOpen, Clock, TrendingUp, ChevronRight, Star, Globe, Headphones, FileText, Shield } from "lucide-react";
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
    <div className="border border-[#E8E8E6] rounded-lg overflow-hidden hover:border-[#7A9D96] transition-colors">
      {/* Chapter Header - Clickable */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-white hover:bg-[#FAFAF8] transition-colors text-left">
        <div className="flex items-center space-x-4 flex-1">
          <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0">{chapter.chapterNumber}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#2C2C2C]">{chapter.title}</h3>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {chapter.lessons?.length || 0} {chapter.lessons?.length === 1 ? "lesson" : "lessons"}
            </p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-[#7A9D96] transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {/* Lessons - Expandable */}
      {isOpen && chapter.lessons && chapter.lessons.length > 0 && (
        <div className="bg-[#FAFAF8] border-t border-[#E8E8E6]">
          {chapter.lessons.map((lesson) => (
            <div key={lesson._id} className="flex items-center space-x-3 px-4 py-3 border-b border-[#E8E8E6] last:border-b-0 hover:bg-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#7A9D96]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#7A9D96]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#2C2C2C]">
                  Lesson {lesson.lessonNumber}: {lesson.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Lessons Message */}
      {isOpen && (!chapter.lessons || chapter.lessons.length === 0) && (
        <div className="bg-[#FAFAF8] border-t border-[#E8E8E6] px-4 py-3">
          <p className="text-sm text-[#6B6B6B] italic">No lessons available yet</p>
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

  const handleEnroll = () => {
    if (!auth?.token) {
      navigate("/register");
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-[#6B6B6B]">Loading course details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white relative overflow-hidden">
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

              <button onClick={handleEnroll} className="bg-white text-[#7A9D96] px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center space-x-2 group">
                <span>{auth?.token ? "Go to Dashboard" : "Enroll Now"}</span>
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
              <div className="bg-white rounded-2xl shadow-md p-8 border border-[#E8E8E6]">
                <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                  About This Course
                </h2>
                <p className="text-[#6B6B6B] leading-relaxed text-lg mb-8">This comprehensive medical interpretation course prepares you for a rewarding career in healthcare communication. You'll learn essential skills, terminology, and ethical practices required to bridge language barriers in medical settings.</p>

                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">What You'll Learn</h3>
                <div className="space-y-3 mb-8">
                  {["The role and responsibilities of a medical interpreter", "Differences between translation and interpretation", "Working in different healthcare settings (on-site, phone, video)", "Consecutive and simultaneous interpreting techniques", "The critical importance of accuracy in healthcare", "HIPAA compliance and patient confidentiality"].map((item, index) => (
                    <div key={index} className="flex items-start group">
                      <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-full p-1 mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-[#2C2C2C]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters List - Accordion */}
              <div className="bg-white rounded-2xl shadow-md p-8 border border-[#E8E8E6]">
                <h2 className="text-3xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
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
                <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E8E8E6]">
                  <h3 className="text-2xl font-bold text-[#2C2C2C] mb-6">Course Includes</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                        <BookOpen className="w-5 h-5 text-[#7A9D96]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">{chapters.length} Chapters</p>
                        <p className="text-sm text-[#6B6B6B]">Comprehensive content</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                        <FileText className="w-5 h-5 text-[#7A9D96]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">Interactive Quizzes</p>
                        <p className="text-sm text-[#6B6B6B]">Test your knowledge</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                        <Award className="w-5 h-5 text-[#7A9D96]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">2 Certificates</p>
                        <p className="text-sm text-[#6B6B6B]">Medical + HIPAA</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                        <Headphones className="w-5 h-5 text-[#7A9D96]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">Lifetime Access</p>
                        <p className="text-sm text-[#6B6B6B]">Learn at your pace</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleEnroll} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2 group">
                    <span>{auth?.token ? "Go to Dashboard" : "Enroll Now"}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Career Stats */}
                <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Career Outlook</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Average Salary</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold">$25-45/hour</p>
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
