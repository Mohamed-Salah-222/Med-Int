import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { Lesson } from "../types";
import { ArrowLeft, BookOpen, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";

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
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading lesson...</div>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-red-600">Lesson not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-12">
          <div className="max-w-4xl mx-auto px-6">
            <button onClick={() => navigate("/dashboard")} className="flex items-center text-white/90 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center mb-4">
              <BookOpen className="w-8 h-8 mr-3" strokeWidth={1.5} />
              <span className="text-lg font-semibold">Lesson {lesson.lessonNumber}</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Lesson Content Card */}
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-8 border border-[#E8E8E6]">
            <div className="lesson-content prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button onClick={() => navigate("/dashboard")} className="bg-white border-2 border-[#E8E8E6] text-[#2C2C2C] px-6 py-3 rounded-lg font-semibold hover:border-[#7A9D96] hover:text-[#7A9D96] transition-all flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button onClick={() => navigate(`/lesson/${id}/quiz`)} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <span>Take Quiz</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default LessonView;
