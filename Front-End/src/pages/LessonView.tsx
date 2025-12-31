import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseAPI } from "../services/api";
import { ChapterInfo, Lesson, LessonResponse } from "../types";
import { ArrowLeft, BookOpen, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import LessonSidebar from "../components/LessonSidebar";
import { AuthContext } from "../context/AuthContext";
import LessonChatbot from "../components/LessonChatbot";

function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");

  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const auth = useContext(AuthContext);

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await courseAPI.getLesson(id!);
        const data = response.data as LessonResponse;
        setLesson(data.lesson);
        setChapterInfo(data.chapter);
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await courseAPI.checkLessonAccess(id!);
        setAccessAllowed(response.data.canAccess);
      } catch (error: any) {
        setAccessAllowed(false);
        setAccessMessage(error.response?.data?.message || "Access denied");
      } finally {
        setAccessLoading(false);
      }
    };

    checkAccess();
  }, [id]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!chapterInfo) return;

      try {
        const COURSE_ID = import.meta.env.VITE_COURSE_ID;
        const response = await courseAPI.getDetailedProgress(COURSE_ID);

        // Find current chapter in progress
        const currentChapter = response.data.progress.chapters.find((ch: any) => ch.chapterId === chapterInfo.id);

        if (currentChapter) {
          // Extract completed lesson IDs
          const completedIds = currentChapter.lessons.filter((l: any) => l.completed).map((l: any) => l.lessonId);

          setCompletedLessonIds(completedIds);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
  }, [chapterInfo]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading lesson...</div>
        </div>
      </Layout>
    );
  }

  if (accessLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Checking access...</div>
        </div>
      </Layout>
    );
  }

  if (!accessAllowed) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 border-[#E8E8E6] text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">Lesson Locked</h2>
            <p className="text-[#6B6B6B] mb-6">{accessMessage}</p>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
              Back to Dashboard
            </button>
          </div>
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
      {chapterInfo && <LessonSidebar chapterTitle={chapterInfo.title} chapterNumber={chapterInfo.chapterNumber} chapterId={chapterInfo.id} lessons={chapterInfo.lessons} currentLessonId={id!} completedLessonIds={completedLessonIds} userRole={auth?.user?.role} />}

      {/* Main content with smooth margin transition */}
      <div className="min-h-screen bg-[#FAFAF8] transition-all duration-300">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-12">
          <div className="max-w-5xl mx-auto px-6">
            <button onClick={() => navigate("/dashboard")} className="flex items-center text-white/90 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center mb-4">
              <BookOpen className="w-8 h-8 mr-3" strokeWidth={1.5} />
              <span className="text-lg font-semibold">Lesson {lesson.lessonNumber}</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight" style={{ fontFamily: "Lexend, sans-serif" }}>
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-5xl mx-auto px-6 py-12">
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

      {lesson && <LessonChatbot lessonId={lesson.id} lessonTitle={lesson.title} />}
    </Layout>
  );
}

export default LessonView;
