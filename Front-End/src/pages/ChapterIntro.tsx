import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { courseAPI } from "../services/api";
import { BookOpen, CheckCircle, ArrowRight, ChevronRight, Target } from "lucide-react";
import Layout from "../components/Layout";

interface ChapterIntroData {
  id: string;
  title: string;
  description: string;
  chapterNumber: number;
  totalLessons: number;
  lessons: {
    _id: string;
    title: string;
    lessonNumber: number;
  }[];
  chapterTest: {
    totalQuestions: number;
    passingScore: number;
  };
}

function ChapterIntro() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [chapter, setChapter] = useState<ChapterIntroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingViewed, setMarkingViewed] = useState(false);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses/chapters/${id}`, {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        });

        setChapter(response.data.chapter);
        setError(false);
      } catch (error) {
        console.error("Error fetching chapter:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChapter();
    }
  }, [id, auth?.token]);

  const handleStartLessons = async () => {
    if (!id) return;

    setMarkingViewed(true);

    try {
      // Mark intro as viewed
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/course/chapters/${id}/view-intro`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        },
      );

      // Navigate to first lesson
      if (chapter && chapter.lessons.length > 0) {
        navigate(`/lesson/${chapter.lessons[0]._id}`);
      }
    } catch (error) {
      console.error("Error marking intro as viewed:", error);
      // Still navigate even if marking fails
      if (chapter && chapter.lessons.length > 0) {
        navigate(`/lesson/${chapter.lessons[0]._id}`);
      }
    } finally {
      setMarkingViewed(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading chapter...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !chapter) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">Failed to load chapter</div>
            <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-6 py-3 rounded-lg hover:bg-[#6A8D86] transition-colors">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12" style={{ fontFamily: "Lexend, sans-serif" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <button onClick={() => navigate("/dashboard")} className="text-[#7A9D96] hover:text-white hover:bg-[#7A9D96] font-semibold mb-6 flex items-center space-x-2 transition-all group border-2 border-[#7A9D96] px-4 py-2 rounded-lg cursor-pointer">
              <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>

            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/10 text-[#7A9D96] px-4 py-2 rounded-full mb-4 border border-[#7A9D96]/20">
              <BookOpen className="w-5 h-5" />
              <span className="font-bold text-sm">Chapter {chapter.chapterNumber}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-[#2C2C2C] mb-4">{chapter.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B6B6B]">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>{chapter.totalLessons} Lessons</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Chapter Test: 20 Questions</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 border border-[#E8E8E6] mb-8">
            {/* Description - Render as HTML */}
            <div className="prose prose-lg max-w-none mb-8 chapter-content" dangerouslySetInnerHTML={{ __html: chapter.description }} />
          </div>

          {/* Lessons Preview Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-[#E8E8E6] mb-8">
            <h3 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center">
              <BookOpen className="w-6 h-6 text-[#7A9D96] mr-3" />
              Lessons in This Chapter
            </h3>
            <div className="grid gap-3">
              {chapter.lessons.map((lesson, index) => (
                <div key={lesson._id} className="flex items-center space-x-4 p-4 bg-[#FAFAF8] rounded-xl border border-[#E8E8E6] hover:border-[#7A9D96]/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-[#7A9D96]">{lesson.lessonNumber}</span>
                  </div>
                  <span className="text-[#2C2C2C] font-medium flex-1">{lesson.title}</span>
                  {index === 0 && <span className="text-xs bg-[#7A9D96] text-white px-3 py-1 rounded-full font-bold">START HERE</span>}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">Ready to Begin?</h3>
                  <p className="text-white/90">Start with Lesson 1 and work your way through the chapter</p>
                </div>
              </div>

              <button onClick={handleStartLessons} disabled={markingViewed} className="bg-white text-[#7A9D96] px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center space-x-3 group disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer">
                <span>{markingViewed ? "Starting..." : "Start Lessons"}</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ChapterIntro;
