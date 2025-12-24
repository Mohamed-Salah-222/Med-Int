import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { courseAPI } from "../services/api";

interface Chapter {
  _id: string;
  title: string;
  description: string;
  chapterNumber: number;
}

function CourseDetail() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded course ID - replace with your actual course ID
  const COURSE_ID = "694ac1c543310bc03730cd4f";

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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 onClick={() => navigate("/")} className="text-2xl font-bold text-blue-600 cursor-pointer">
            Medical Interpreter Academy
          </h1>
          <div className="space-x-4">
            {!auth?.token ? (
              <>
                <button onClick={() => navigate("/login")} className="text-gray-600 hover:text-gray-900">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Register
                </button>
              </>
            ) : (
              <button onClick={() => navigate("/dashboard")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Dashboard
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Medical Interpretation Course</h1>
          <p className="text-xl">Master the skills needed to become a professional medical interpreter</p>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* About Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">About This Course</h2>
          <p className="text-gray-700 leading-relaxed mb-6">This comprehensive medical interpretation course prepares you for a rewarding career in healthcare communication. You'll learn essential skills, terminology, and ethical practices required to bridge language barriers in medical settings.</p>

          <h3 className="text-2xl font-bold mb-4">What You'll Learn</h3>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>The role and responsibilities of a medical interpreter</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Differences between translation and interpretation</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Working in different healthcare settings (on-site, phone, video)</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Consecutive and simultaneous interpreting techniques</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>The critical importance of accuracy in healthcare</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>HIPAA compliance and patient confidentiality</span>
            </li>
          </ul>

          <h3 className="text-2xl font-bold mb-4">Course Structure</h3>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">{chapters.length}</div>
              <div className="text-gray-600">Chapters</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <div className="text-gray-600">Certificates</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Online</div>
            </div>
          </div>

          <button onClick={handleEnroll} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700">
            {auth?.token ? "Go to Dashboard" : "Enroll Now"}
          </button>
        </div>

        {/* Chapters List */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Course Chapters</h2>
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <div key={chapter._id} className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Chapter {chapter.chapterNumber}: {chapter.title}
                </h3>
                <p className="text-gray-600 mt-1">{chapter.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
