import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Lesson } from "../types";

function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await courseAPI.getLesson(id!);
        setLesson(response.data.lesson);
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading lesson...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Lesson not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/dashboard")} className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900">Lesson {lesson.lessonNumber}</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Lesson Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <span className="text-sm text-gray-500 font-medium">Lesson {lesson.lessonNumber}</span>
            <h1 className="text-4xl font-bold text-gray-900 mt-1">{lesson.title}</h1>
          </div>

          {/* Lesson Content */}
          <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button onClick={() => navigate("/dashboard")} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300">
            Return to Dashboard
          </button>
          <button onClick={() => navigate(`/lesson/${id}/quiz`)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
            Take Quiz →
          </button>
        </div>
      </div>
    </div>
  );
}

export default LessonView;
