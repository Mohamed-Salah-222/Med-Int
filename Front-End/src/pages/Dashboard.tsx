import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { courseAPI } from "../services/api";
import { DetailedProgress } from "../types";
import { BookOpen, CheckCircle, Clock, Award, TrendingUp, Target, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";

function Dashboard() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [progress, setProgress] = useState<DetailedProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const COURSE_ID = import.meta.env.VITE_COURSE_ID;

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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading your progress...</div>
        </div>
      </Layout>
    );
  }

  if (!progress) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-red-600">Failed to load progress. Please try again.</div>
        </div>
      </Layout>
    );
  }

  const completionPercentage = Math.round((progress.chapters.filter((c) => c.testPassed).length / progress.chapters.length) * 100);

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#E8E8E6]">
            <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
              Welcome back, {auth?.user?.name}!
            </h1>
            <p className="text-xl text-[#6B6B6B]">Continue your journey to becoming a certified medical interpreter</p>
          </div>

          {/* Certificate Banner - Only show if completed */}
          {progress.courseCompleted && progress.certificateIssued && (
            <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Award className="w-16 h-16" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-3xl font-bold mb-2">🎉 Congratulations!</h2>
                    <p className="text-xl text-white/90">You've completed the course and earned your certificates!</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-white text-[#7A9D96] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>View Certificates</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Progress Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-8 h-8 text-[#7A9D96]" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#2C2C2C]">{progress.currentChapter}</div>
                  <div className="text-sm text-[#6B6B6B] mt-1">Current Chapter</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#2C2C2C]">
                    {progress.chapters.filter((c) => c.testPassed).length}/{progress.chapters.length}
                  </div>
                  <div className="text-sm text-[#6B6B6B] mt-1">Chapters Complete</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#2C2C2C]">{completionPercentage}%</div>
                  <div className="text-sm text-[#6B6B6B] mt-1">Overall Progress</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-8 h-8 text-purple-600" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#2C2C2C]">{progress.courseCompleted ? "✅ Done" : "🔄 Active"}</div>
                  <div className="text-sm text-[#6B6B6B] mt-1">Course Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-[#E8E8E6]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#2C2C2C]">Course Completion</span>
              <span className="text-sm font-bold text-[#7A9D96]">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-[#E8E8E6] rounded-full h-3">
              <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          {/* Next Action Card */}
          {progress.nextAction && (
            <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] text-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-8 h-8" strokeWidth={1.5} />
                <h3 className="text-2xl font-bold">Your Next Step</h3>
              </div>
              <p className="text-xl text-white/90 mb-6">{progress.nextAction.message}</p>

              {progress.nextAction.type === "lesson" && (
                <button
                  onClick={() => {
                    const chapter = progress.chapters.find((c) => c.chapterNumber === progress.nextAction!.chapterNumber);
                    const lesson = chapter?.lessons.find((l) => l.lessonNumber === progress.nextAction!.lessonNumber);
                    if (lesson) navigate(`/lesson/${lesson.lessonId}`);
                  }}
                  className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center space-x-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Start Lesson</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {progress.nextAction.type === "chapter-test" && (
                <button
                  onClick={() => {
                    const chapter = progress.chapters.find((c) => c.chapterNumber === progress.nextAction!.chapterNumber);
                    if (chapter) navigate(`/chapter/${chapter.chapterId}/test`);
                  }}
                  className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center space-x-2"
                >
                  <Target className="w-5 h-5" />
                  <span>Take Chapter Test</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {progress.nextAction.type === "final-exam" && (
                <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Take Final Exam</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {progress.nextAction.type === "completed" && (
                <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>View Your Certificates</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Chapters Progress */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Playfair Display, serif" }}>
              Your Learning Path
            </h2>

            {progress.chapters.map((chapter) => (
              <div key={chapter.chapterId} className="bg-white rounded-xl shadow-md p-6 border border-[#E8E8E6]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-[#6B6B6B]">
                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {chapter.completedLessons}/{chapter.totalLessons} lessons
                      </span>
                      {chapter.testTaken && (
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Test score: {chapter.testScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  {chapter.testPassed && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </div>
                  )}
                </div>

                {/* Lessons List */}
                <div className="space-y-2 mb-4">
                  {chapter.lessons.map((lesson) => (
                    <div key={lesson.lessonId} className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg hover:bg-[#E8E8E6] cursor-pointer transition-colors" onClick={() => navigate(`/lesson/${lesson.lessonId}`)}>
                      <div className="flex items-center space-x-3">
                        {lesson.completed ? <CheckCircle className="w-6 h-6 text-green-600" strokeWidth={2} /> : <Clock className="w-6 h-6 text-[#6B6B6B]" strokeWidth={2} />}
                        <div>
                          <span className="font-semibold text-[#2C2C2C]">
                            Lesson {lesson.lessonNumber}: {lesson.title}
                          </span>
                          {lesson.completed && lesson.attempts > 0 && (
                            <div className="text-xs text-[#6B6B6B] mt-1">
                              Completed in {lesson.attempts} {lesson.attempts === 1 ? "attempt" : "attempts"}
                            </div>
                          )}
                        </div>
                      </div>
                      {lesson.completed && <div className="text-sm font-semibold text-green-600">{lesson.quizScore}/5 ✓</div>}
                    </div>
                  ))}
                </div>

                {/* Chapter Test Button */}
                {chapter.allLessonsCompleted && (
                  <div className="pt-4 border-t border-[#E8E8E6]">
                    <button onClick={() => navigate(`/chapter/${chapter.chapterId}/test`)} className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${chapter.testPassed ? "bg-green-100 text-green-800 cursor-default" : "bg-[#7A9D96] text-white hover:bg-[#6A8D86] shadow-md"}`} disabled={chapter.testPassed}>
                      {chapter.testPassed ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Chapter Test Passed ({chapter.testScore}%)</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-5 h-5" />
                          <span>Take Chapter Test</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Exam Section */}
          {progress.chapters.every((c) => c.testPassed) && !progress.courseCompleted && (
            <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center space-x-4 mb-4">
                <Award className="w-12 h-12" strokeWidth={1.5} />
                <div>
                  <h3 className="text-3xl font-bold mb-2">Final Exam Ready!</h3>
                  <p className="text-xl text-white/90">You've completed all chapters. Take the final exam to earn your certificates!</p>
                </div>
              </div>
              {progress.finalExam.attempts.length > 0 && (
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <p className="text-sm">
                    Best Score: <span className="font-bold">{progress.finalExam.bestScore}%</span> | Attempts: <span className="font-bold">{progress.finalExam.attempts.length}</span>
                  </p>
                </div>
              )}
              <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg flex items-center space-x-2">
                <Award className="w-6 h-6" />
                <span>Take Final Exam</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
