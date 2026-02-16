import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { courseAPI } from "../services/api";
import { DetailedProgress } from "../types";
import { BookOpen, CheckCircle, Clock, Award, TrendingUp, Target, ChevronRight, ChevronDown, Lock } from "lucide-react";
import Layout from "../components/Layout";

function Dashboard() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const isAdminOrSupervisor = auth?.user?.role === "Admin" || auth?.user?.role === "SuperVisor";

  const [progress, setProgress] = useState<DetailedProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const COURSE_ID = import.meta.env.VITE_COURSE_ID;

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await courseAPI.getDetailedProgress(COURSE_ID);
        setProgress(response.data.progress);
        setError(false);

        // Auto-expand the current chapter (first incomplete chapter)
        const currentChapter = response.data.progress.chapters.find((c: any) => !c.testPassed);
        if (currentChapter) {
          setExpandedChapters(new Set([currentChapter.chapterId]));
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading your progress...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !progress) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">Failed to load progress. Please try again.</div>
            <button onClick={() => window.location.reload()} className="bg-[#7A9D96] text-white px-6 py-2 rounded-lg hover:bg-[#6A8D86] transition-colors cursor-pointer">
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate totals
  const totalLessons = progress.chapters.reduce((sum, ch) => sum + ch.totalLessons, 0);
  const completedLessonsCount = progress.chapters.reduce((sum, ch) => sum + ch.completedLessons, 0);
  const completedChaptersCount = progress.chapters.filter((c) => c.testPassed).length;
  const completionPercentage = Math.round((completedChaptersCount / progress.chapters.length) * 100);
  const lessonCompletionPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12" style={{ fontFamily: "Lexend, sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-white to-[#FAFAF8] rounded-2xl shadow-md p-6 sm:p-8 mb-6 border border-[#E8E8E6]">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Welcome back, {auth?.user?.name}!
            </h1>
            <p className="text-base sm:text-lg text-[#6B6B6B]">Continue your journey to becoming a certified medical interpreter</p>
          </div>

          {/* Certificate Banner */}
          {progress.courseCompleted && progress.certificateIssued && (
            <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Award className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">Congratulations!</h2>
                    <p className="text-base sm:text-lg text-white/90">You've completed the course and earned your certificates!</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-white text-[#7A9D96] px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2 group cursor-pointer">
                  <Award className="w-5 h-5" />
                  <span>View Certificates</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Current Chapter */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#7A9D96]" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]">{progress.currentChapter}</div>
                  <div className="text-xs text-[#6B6B6B] mt-1">Current Chapter</div>
                </div>
              </div>
            </div>

            {/* Lessons Progress */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#7A9D96]" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-xl sm:text-3xl font-bold text-[#2C2C2C]">
                    {completedLessonsCount}/{totalLessons}
                  </div>
                  <div className="text-xs text-[#6B6B6B] mt-1">Lessons Done</div>
                </div>
              </div>
            </div>

            {/* Chapters Progress */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-[#7A9D96]" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-xl sm:text-3xl font-bold text-[#2C2C2C]">
                    {completedChaptersCount}/{progress.chapters.length}
                  </div>
                  <div className="text-xs text-[#6B6B6B] mt-1">Chapters Done</div>
                </div>
              </div>
            </div>

            {/* Course Status */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <Award className="w-7 h-7 sm:w-8 sm:h-8 text-[#7A9D96]" strokeWidth={1.5} />
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-[#2C2C2C]">{progress.courseCompleted ? "Complete" : "Active"}</div>
                  <div className="text-xs text-[#6B6B6B] mt-1">Course Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 mb-6 border border-[#E8E8E6]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#2C2C2C]">Course Progress</span>
              <span className="text-sm font-bold text-[#7A9D96]">{lessonCompletionPercentage}%</span>
            </div>
            <div className="w-full bg-[#E8E8E6] rounded-full h-3">
              <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-3 rounded-full transition-all duration-500" style={{ width: `${lessonCompletionPercentage}%` }}></div>
            </div>
          </div>

          {/* Next Action Card */}
          {progress.nextAction && (
            <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] text-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white/60 mb-2">Your Next Step</div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">{progress.nextAction.message}</h3>
                  <p className="text-white/80 text-sm sm:text-base">Keep the momentum going!</p>
                </div>

                <div className="flex-shrink-0">
                  {progress.nextAction.type === "chapter-intro" && (
                    <button onClick={() => navigate(`/chapter/${progress.nextAction!.chapterId}/intro`)} className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2 group cursor-pointer">
                      <BookOpen className="w-5 h-5" />
                      <span>Start Chapter</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {progress.nextAction.type === "lesson" && (
                    <button onClick={() => navigate(`/lesson/${progress.nextAction!.lessonId}`)} className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2 group cursor-pointer">
                      <BookOpen className="w-5 h-5" />
                      <span>Continue Lesson</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {progress.nextAction.type === "chapter-test" && (
                    <button onClick={() => navigate(`/chapter/${progress.nextAction!.chapterId}/test`)} className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2 group cursor-pointer">
                      <Target className="w-5 h-5" />
                      <span>Take Test</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {progress.nextAction.type === "final-exam" && (
                    <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2 group cursor-pointer">
                      <Award className="w-5 h-5" />
                      <span>Take Final Exam</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {progress.nextAction.type === "completed" && (
                    <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-[#7A9D96] hover:bg-[#6A8D86] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2 group cursor-pointer">
                      <Award className="w-5 h-5" />
                      <span>View Certificates</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Learning Path - ACCORDION */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Your Learning Path
            </h2>

            {progress.chapters.map((chapter) => {
              const isExpanded = expandedChapters.has(chapter.chapterId);

              return (
                <div key={chapter.chapterId} className={`bg-white rounded-xl shadow-md border overflow-hidden transition-all ${chapter.isUnlocked ? "border-[#E8E8E6] hover:shadow-lg" : "border-gray-300 opacity-60"}`}>
                  {/* Chapter Header - Clickable */}
                  <button onClick={() => chapter.isUnlocked && toggleChapter(chapter.chapterId)} className={`w-full flex items-center justify-between p-5 sm:p-6 transition-colors text-left ${chapter.isUnlocked ? "hover:bg-[#FAFAF8] cursor-pointer" : "cursor-not-allowed"}`} disabled={!chapter.isUnlocked}>
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${chapter.testPassed ? "bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white" : chapter.isUnlocked ? "bg-[#E8E8E6] text-[#6B6B6B]" : "bg-gray-200 text-gray-400"}`}>{chapter.chapterNumber}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg sm:text-xl font-bold mb-1 ${chapter.isUnlocked ? "text-[#2C2C2C]" : "text-gray-400"}`}>{chapter.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#6B6B6B]">
                          {!chapter.isUnlocked ? (
                            <span className="flex items-center text-gray-400">
                              <Lock className="w-4 h-4 mr-1" />
                              Complete previous chapter first
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                {chapter.completedLessons}/{chapter.totalLessons} lessons
                              </span>
                              {chapter.testPassed && (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Test Passed
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      {chapter.testPassed && (
                        <div className="hidden sm:flex bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </div>
                      )}
                      {chapter.isUnlocked && <ChevronDown className={`w-6 h-6 text-[#7A9D96] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />}
                    </div>
                  </button>

                  {/* Chapter Content - Expandable (only if unlocked) */}
                  {isExpanded && chapter.isUnlocked && (
                    <div className="border-t border-[#E8E8E6] bg-[#FAFAF8] p-5 sm:p-6">
                      {/* Check if intro viewed */}
                      {!chapter.introViewed && !isAdminOrSupervisor ? (
                        <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] text-white p-6 rounded-xl shadow-lg">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold mb-2">Start This Chapter</h4>
                              <p className="text-white/90 mb-4">View the chapter introduction to understand what you'll learn before accessing lessons.</p>
                              <button onClick={() => navigate(`/chapter/${chapter.chapterId}/intro`)} className="bg-white text-[#7A9D96] px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center space-x-2 group cursor-pointer">
                                <span>View Chapter Introduction</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Lessons List */}
                          <div className="space-y-2 mb-4">
                            {chapter.lessons.map((lesson, lessonIndex) => {
                              const isLocked = !isAdminOrSupervisor && !lesson.completed && lessonIndex > 0 && !chapter.lessons[lessonIndex - 1].completed;

                              return (
                                <div key={lesson.lessonId} className={`flex items-center justify-between p-4 rounded-lg transition-all ${isLocked ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white hover:shadow-sm cursor-pointer border border-transparent hover:border-[#7A9D96]/30"}`} onClick={() => !isLocked && navigate(`/lesson/${lesson.lessonId}`)}>
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    {isLocked ? (
                                      <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                                    ) : lesson.completed ? (
                                      <div className="w-5 h-5 rounded-full bg-[#7A9D96] flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                                      </div>
                                    ) : (
                                      <Clock className="w-5 h-5 text-[#6B6B6B] flex-shrink-0" strokeWidth={2} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className={`font-semibold text-sm sm:text-base ${isLocked ? "text-gray-400" : "text-[#2C2C2C]"}`}>
                                        Lesson {lesson.lessonNumber}: {lesson.title}
                                      </span>
                                      {lesson.completed && lesson.attempts > 0 && (
                                        <div className="text-xs text-[#6B6B6B] mt-0.5">
                                          Completed • {lesson.attempts} {lesson.attempts === 1 ? "attempt" : "attempts"}
                                        </div>
                                      )}
                                      {isLocked && <div className="text-xs text-red-600 mt-0.5">Complete previous lesson first</div>}
                                    </div>
                                  </div>
                                  {lesson.completed && <div className="text-sm font-bold text-[#7A9D96] flex-shrink-0 ml-2">{lesson.quizScore}/5</div>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Chapter Test Button */}
                          <div className="pt-4 border-t border-[#E8E8E6]">
                            {!chapter.allLessonsCompleted && !isAdminOrSupervisor ? (
                              <button className="w-full py-3 rounded-xl font-semibold bg-gray-100 text-gray-500 cursor-not-allowed flex items-center justify-center space-x-2" disabled>
                                <Lock className="w-5 h-5" />
                                <span className="text-sm sm:text-base">Complete all lessons to unlock test</span>
                              </button>
                            ) : (
                              <button onClick={() => navigate(`/chapter/${chapter.chapterId}/test`)} className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${chapter.testPassed ? "bg-green-100 text-green-700 cursor-default" : "bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white hover:shadow-lg cursor-pointer"}`} disabled={chapter.testPassed}>
                                {chapter.testPassed ? (
                                  <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Test Passed </span>
                                  </>
                                ) : (
                                  <>
                                    <Target className="w-5 h-5" />
                                    <span>Take Chapter Test</span>
                                    <ChevronRight className="w-5 h-5" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final Exam Section */}
          <div className="mt-6">
            {!progress.chapters.every((c) => c.testPassed) && !isAdminOrSupervisor ? (
              <div className="bg-white border-2 border-[#E8E8E6] rounded-2xl shadow-sm p-6 sm:p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#E8E8E6] rounded-lg p-3 flex-shrink-0">
                    <Lock className="w-8 h-8 text-[#6B6B6B]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] mb-2">Final Exam Locked</h3>
                    <p className="text-sm sm:text-base text-[#6B6B6B] mb-4">Pass all chapter tests to unlock the final exam</p>
                    <div className="bg-[#FAFAF8] rounded-lg p-4 border border-[#E8E8E6]">
                      <p className="text-sm text-[#6B6B6B]">
                        Progress:{" "}
                        <span className="font-bold text-[#2C2C2C]">
                          {progress.chapters.filter((c) => c.testPassed).length}/{progress.chapters.length}
                        </span>{" "}
                        chapters completed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : !progress.courseCompleted ? (
              <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <Award className="w-12 h-12 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-2">Final Exam Ready!</h3>
                      <p className="text-sm sm:text-base text-white/90 mb-3">You've completed all chapters. Take the final exam to earn your certificates!</p>
                      {progress.finalExam.attempts.length > 0 && (
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-sm">
                            Best Score: <span className="font-bold">{progress.finalExam.bestScore}%</span> • Attempts: <span className="font-bold">{progress.finalExam.attempts.length}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-white text-[#7A9D96] px-6 sm:px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2 group flex-shrink-0 cursor-pointer">
                    <Award className="w-6 h-6" />
                    <span>Take Final Exam</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
