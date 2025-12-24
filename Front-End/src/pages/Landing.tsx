import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Medical Interpreter Academy</h1>
          <div className="space-x-4">
            <button onClick={() => navigate("/login")} className="text-gray-600 hover:text-gray-900">
              Login
            </button>
            <button onClick={() => navigate("/register")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Become a Certified Medical Interpreter</h1>
          <p className="text-xl mb-8">Launch your career in healthcare with professional training in medical interpretation</p>
          <button onClick={() => navigate("/course")} className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100">
            View Course
          </button>
        </div>
      </div>

      {/* Course Card */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Course</h2>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center">
            <h3 className="text-white text-3xl font-bold">Medical Interpretation</h3>
          </div>

          <div className="p-8">
            <p className="text-gray-600 mb-6">An interactive course for learning medical interpretation</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Professional certification upon completion</span>
              </div>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Comprehensive lessons with quizzes</span>
              </div>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>HIPAA certification included</span>
              </div>
            </div>

            <button onClick={() => navigate("/course")} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
