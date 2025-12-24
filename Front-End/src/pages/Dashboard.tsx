import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { courseAPI } from "../services/api";
import { DetailedProgress } from "../types";

function Dashboard() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [progress, setProgress] = useState<DetailedProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const COURSE_ID = "694ac1c543310bc03730cd4f"; // Replace with actual ID

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await courseAPI.getDetailedProgress(COURSE_ID);
        setProgress(response.data.progress);
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const handleLogout = () => {
    auth?.logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!progress) {
    return <div className="min-h-screen flex items-center justify-center">Failed to load progress</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {auth?.user?.name}!</h2>
          <p className="text-gray-600">Continue your journey to becoming a certified medical interpreter</p>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 mb-2">Current Chapter</div>
            <div className="text-3xl font-bold text-blue-600">{progress.currentChapter}</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 mb-2">Chapters Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {progress.chapters.filter((c) => c.testPassed).length} / {progress.chapters.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 mb-2">Course Status</div>
            <div className="text-xl font-bold text-gray-900">{progress.courseCompleted ? "✅ Completed" : "🔄 In Progress"}</div>
          </div>
        </div>

        {/* Next Action */}
        {progress.nextAction && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-2">Next Step</h3>
            <p className="text-lg mb-4">{progress.nextAction.message}</p>

            {progress.nextAction.type === "lesson" && (
              <button
                onClick={() => {
                  const chapter = progress.chapters.find((c) => c.chapterNumber === progress.nextAction!.chapterNumber);
                  const lesson = chapter?.lessons.find((l) => l.lessonNumber === progress.nextAction!.lessonNumber);
                  if (lesson) navigate(`/lesson/${lesson.lessonId}`);
                }}
                className="bg-white text-blue-600 px-6 py-2 rounded font-semibold hover:bg-gray-100"
              >
                Start Lesson
              </button>
            )}

            {progress.nextAction.type === "chapter-test" && (
              <button
                onClick={() => {
                  const chapter = progress.chapters.find((c) => c.chapterNumber === progress.nextAction!.chapterNumber);
                  if (chapter) navigate(`/chapter/${chapter.chapterId}/test`);
                }}
                className="bg-white text-blue-600 px-6 py-2 rounded font-semibold hover:bg-gray-100"
              >
                Take Chapter Test
              </button>
            )}

            {progress.nextAction.type === "final-exam" && (
              <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-white text-blue-600 px-6 py-2 rounded font-semibold hover:bg-gray-100">
                Take Final Exam
              </button>
            )}

            {progress.nextAction.type === "completed" && (
              <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-white text-blue-600 px-6 py-2 rounded font-semibold hover:bg-gray-100">
                View Certificates
              </button>
            )}
          </div>
        )}

        {/* Chapters List */}
        <div className="space-y-6">
          {progress.chapters.map((chapter) => (
            <div key={chapter.chapterId} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {chapter.completedLessons} / {chapter.totalLessons} lessons completed
                  </p>
                </div>
                <div>{chapter.testPassed && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">✓ Passed</span>}</div>
              </div>

              {/* Lessons */}
              <div className="space-y-2">
                {chapter.lessons.map((lesson) => (
                  <div key={lesson.lessonId} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => navigate(`/lesson/${lesson.lessonId}`)}>
                    <div className="flex items-center">
                      {lesson.completed ? (
                        <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="font-medium">
                        Lesson {lesson.lessonNumber}: {lesson.title}
                      </span>
                    </div>
                    {lesson.completed && <span className="text-sm text-gray-600">Score: {lesson.quizScore} / 5</span>}
                  </div>
                ))}
              </div>

              {/* Chapter Test Button */}
              {chapter.allLessonsCompleted && (
                <div className="mt-4 pt-4 border-t">
                  <button onClick={() => navigate(`/chapter/${chapter.chapterId}/test`)} className={`w-full py-2 rounded font-semibold ${chapter.testPassed ? "bg-green-100 text-green-800" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                    {chapter.testPassed ? `Chapter Test Passed (${chapter.testScore}/20)` : "Take Chapter Test"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final Exam Section */}
        {progress.chapters.every((c) => c.testPassed) && (
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-2">Final Exam</h3>
            <p className="mb-4">{progress.finalExam.passed ? "🎉 Congratulations! You passed the final exam!" : "You've completed all chapters. Ready for the final exam?"}</p>
            {progress.finalExam.attempts.length > 0 && (
              <p className="mb-4 text-sm">
                Best Score: {progress.finalExam.bestScore}% | Attempts: {progress.finalExam.attempts.length}
              </p>
            )}
            <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-white text-purple-600 px-6 py-2 rounded font-semibold hover:bg-gray-100">
              {progress.finalExam.passed ? "View Results" : "Take Final Exam"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
