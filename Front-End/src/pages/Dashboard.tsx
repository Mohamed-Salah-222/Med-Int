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
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1B3A5C] mx-auto mb-4"></div>
            <p className="text-xl text-[#5A5A5A] font-semibold">Loading your progress...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !progress) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">Failed to load progress. Please try again.</div>
            <button onClick={() => window.location.reload()} className="bg-[#1B3A5C] text-white px-6 py-2 rounded-lg hover:bg-[#16304d] transition-colors cursor-pointer">
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
  const lessonCompletionPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  // Side-rail stat rows (context, not the main content)
  const stats = [
    { icon: BookOpen, value: progress.currentChapter, label: "Current Chapter" },
    { icon: CheckCircle, value: `${completedLessonsCount}/${totalLessons}`, label: "Lessons Done" },
    { icon: TrendingUp, value: `${completedChaptersCount}/${progress.chapters.length}`, label: "Chapters Done" },
    { icon: Award, value: progress.courseCompleted ? "Complete" : "Active", label: "Course Status" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[#F7F7F5] py-8 sm:py-12" style={{ fontFamily: "Lexend, sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Flat header — plain page content, no card */}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-1" style={{ fontFamily: "Lexend, sans-serif" }}>
              Welcome back, {auth?.user?.name}!
            </h1>
            <p className="text-base sm:text-lg text-[#5A5A5A]">Continue your journey to becoming a certified medical interpreter</p>
          </header>

          {/* Certificate Banner — flattened, navy left accent instead of gradient */}
          {progress.courseCompleted && progress.certificateIssued && (
            <div className="bg-white border border-[#E5E5E3] border-l-4 border-l-[#1B3A5C] rounded-xl p-6 sm:p-8 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Award className="w-12 h-12 sm:w-14 sm:h-14 text-[#1B3A5C] shrink-0" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-1">Congratulations!</h2>
                    <p className="text-base sm:text-lg text-[#5A5A5A]">You've completed the course and earned your certificates!</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-[#1B3A5C] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#16304d] transition-all flex items-center space-x-2 group cursor-pointer shrink-0">
                  <Award className="w-5 h-5" />
                  <span>View Certificates</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Two-column layout: slim side rail (stats) + wide main column (learning path) */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ============ SIDE RAIL ============ */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Stats — compact vertical list */}
                <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
                  <div className="divide-y divide-[#E5E5E3]">
                    {stats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-9 h-9 rounded-lg bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
                          <stat.icon className="w-5 h-5 text-[#1B3A5C]" strokeWidth={1.75} />
                        </div>
                        <div className="text-xl font-bold text-[#2C2C2C] leading-none">{stat.value}</div>
                        <div className="text-sm text-[#5A5A5A] ml-auto text-right">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar — directly under the stats */}
                  <div className="px-4 py-4 border-t border-[#E5E5E3] bg-[#F7F7F5]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#2C2C2C]">Course Progress</span>
                      <span className="text-sm font-bold text-[#1B3A5C]">{lessonCompletionPercentage}%</span>
                    </div>
                    <div className="w-full bg-[#E5E5E3] rounded-full h-2.5">
                      <div className="bg-[#1B3A5C] h-2.5 rounded-full transition-all duration-500" style={{ width: `${lessonCompletionPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* ============ MAIN COLUMN ============ */}
            <main className="lg:col-span-2 space-y-8">
              {/* Next Action — most prominent element, via placement + navy left accent bar */}
              {progress.nextAction && (
                <div className="bg-white border border-[#E5E5E3] border-l-4 border-l-[#1B3A5C] rounded-xl shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-[#1B3A5C] mb-2">Your Next Step</div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2">{progress.nextAction.message}</h3>
                      <p className="text-[#5A5A5A] text-sm sm:text-base">Keep the momentum going!</p>
                    </div>

                    <div className="shrink-0">
                      {progress.nextAction.type === "chapter-intro" && (
                        <button onClick={() => navigate(`/chapter/${progress.nextAction!.chapterId}/intro`)} className="bg-[#1B3A5C] hover:bg-[#16304d] text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 group cursor-pointer">
                          <BookOpen className="w-5 h-5" />
                          <span>Start Chapter</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {progress.nextAction.type === "lesson" && (
                        <button onClick={() => navigate(`/lesson/${progress.nextAction!.lessonId}`)} className="bg-[#1B3A5C] hover:bg-[#16304d] text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 group cursor-pointer">
                          <BookOpen className="w-5 h-5" />
                          <span>Continue Lesson</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {progress.nextAction.type === "chapter-test" && (
                        <button onClick={() => navigate(`/chapter/${progress.nextAction!.chapterId}/test`)} className="bg-[#1B3A5C] hover:bg-[#16304d] text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 group cursor-pointer">
                          <Target className="w-5 h-5" />
                          <span>Take Test</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {progress.nextAction.type === "final-exam" && (
                        <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-[#1B3A5C] hover:bg-[#16304d] text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 group cursor-pointer">
                          <Award className="w-5 h-5" />
                          <span>Take Final Exam</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {progress.nextAction.type === "completed" && (
                        <button onClick={() => navigate(`/certificate/${COURSE_ID}`)} className="bg-[#1B3A5C] hover:bg-[#16304d] text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 group cursor-pointer">
                          <Award className="w-5 h-5" />
                          <span>View Certificates</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Path — vertical timeline / roadmap */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
                  Your Learning Path
                </h2>

                <div className="relative">
                  {/* Continuous timeline line connecting the chapter nodes */}
                  <div className="absolute left-5 sm:left-6 top-3 bottom-3 w-px bg-[#E5E5E3]" aria-hidden="true"></div>

                  <div className="space-y-4">
                    {progress.chapters.map((chapter) => {
                      const isExpanded = expandedChapters.has(chapter.chapterId);

                      return (
                        <div key={chapter.chapterId} className="relative pl-14 sm:pl-16">
                          {/* Timeline node — filled/checked if complete, outlined if in progress, greyed if locked */}
                          <div
                            aria-hidden="true"
                            className={`absolute left-0 top-1 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg z-10 ${
                              chapter.testPassed
                                ? "bg-[#1B3A5C] text-white"
                                : chapter.isUnlocked
                                ? "bg-white border-2 border-[#1B3A5C] text-[#1B3A5C]"
                                : "bg-[#F7F7F5] border-2 border-gray-300 text-gray-400"
                            }`}
                          >
                            {chapter.testPassed ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> : chapter.isUnlocked ? chapter.chapterNumber : <Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>

                          {/* Chapter block — flat, thin border (no card elevation) */}
                          <div className={`rounded-lg border bg-white overflow-hidden transition-colors ${chapter.isUnlocked ? (isExpanded ? "border-[#1B3A5C]/40" : "border-[#E5E5E3] hover:border-[#1B3A5C]/30") : "border-gray-200 opacity-70"}`}>
                            {/* Chapter Header - Clickable */}
                            <button onClick={() => chapter.isUnlocked && toggleChapter(chapter.chapterId)} className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors text-left ${chapter.isUnlocked ? "hover:bg-[#F7F7F5] cursor-pointer" : "cursor-not-allowed"}`} disabled={!chapter.isUnlocked}>
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-lg sm:text-xl font-bold mb-1 ${chapter.isUnlocked ? "text-[#2C2C2C]" : "text-gray-400"}`}>{chapter.title}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#5A5A5A]">
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
                              <div className="flex items-center space-x-3 shrink-0 ml-4">
                                {chapter.testPassed && (
                                  <div className="hidden sm:flex bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Complete
                                  </div>
                                )}
                                {chapter.isUnlocked && <ChevronDown className={`w-6 h-6 text-[#1B3A5C] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />}
                              </div>
                            </button>

                            {/* Chapter Content - Expandable (only if unlocked) */}
                            {isExpanded && chapter.isUnlocked && (
                              <div className="border-t border-[#E5E5E3] bg-[#F7F7F5] p-4 sm:p-5">
                                {/* Check if intro viewed */}
                                {!chapter.introViewed && !isAdminOrSupervisor ? (
                                  <div className="bg-white border border-[#1B3A5C]/20 border-l-4 border-l-[#1B3A5C] rounded-lg p-5 sm:p-6">
                                    <div className="flex items-start space-x-4">
                                      <div className="w-11 h-11 bg-[#1B3A5C]/10 rounded-lg flex items-center justify-center shrink-0">
                                        <BookOpen className="w-6 h-6 text-[#1B3A5C]" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="text-lg font-bold text-[#2C2C2C] mb-2">Start This Chapter</h4>
                                        <p className="text-[#5A5A5A] mb-4">View the chapter introduction to understand what you'll learn before accessing lessons.</p>
                                        <button onClick={() => navigate(`/chapter/${chapter.chapterId}/intro`)} className="bg-[#1B3A5C] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#16304d] transition-all flex items-center space-x-2 group cursor-pointer">
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
                                          <div key={lesson.lessonId} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isLocked ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60" : "bg-white border-[#E5E5E3] hover:border-[#1B3A5C]/40 cursor-pointer"}`} onClick={() => !isLocked && navigate(`/lesson/${lesson.lessonId}`)}>
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                              {isLocked ? (
                                                <Lock className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                                              ) : lesson.completed ? (
                                                <div className="w-5 h-5 rounded-full bg-[#1B3A5C] flex items-center justify-center shrink-0">
                                                  <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                                                </div>
                                              ) : (
                                                <Clock className="w-5 h-5 text-[#5A5A5A] shrink-0" strokeWidth={2} />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <span className={`font-semibold text-sm sm:text-base ${isLocked ? "text-gray-400" : "text-[#2C2C2C]"}`}>
                                                  Lesson {lesson.lessonNumber}: {lesson.title}
                                                </span>
                                                {lesson.completed && lesson.attempts > 0 && (
                                                  <div className="text-xs text-[#5A5A5A] mt-0.5">
                                                    Completed • {lesson.attempts} {lesson.attempts === 1 ? "attempt" : "attempts"}
                                                  </div>
                                                )}
                                                {isLocked && <div className="text-xs text-red-600 mt-0.5">Complete previous lesson first</div>}
                                              </div>
                                            </div>
                                            {lesson.completed && <div className="text-sm font-bold text-[#1B3A5C] shrink-0 ml-2">{lesson.quizScore}/5</div>}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Chapter Test Button */}
                                    <div className="pt-4 border-t border-[#E5E5E3]">
                                      {!chapter.allLessonsCompleted && !isAdminOrSupervisor ? (
                                        <button className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-500 cursor-not-allowed flex items-center justify-center space-x-2" disabled>
                                          <Lock className="w-5 h-5" />
                                          <span className="text-sm sm:text-base">Complete all lessons to unlock test</span>
                                        </button>
                                      ) : (
                                        <button onClick={() => navigate(`/chapter/${chapter.chapterId}/test`)} className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${chapter.testPassed ? "bg-green-100 text-green-700 cursor-default" : "bg-[#1B3A5C] text-white hover:bg-[#16304d] cursor-pointer"}`} disabled={chapter.testPassed}>
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Final Exam Section */}
              <div>
                {!progress.chapters.every((c) => c.testPassed) && !isAdminOrSupervisor ? (
                  <div className="bg-white border border-[#E5E5E3] border-l-4 border-l-gray-300 rounded-xl p-6 sm:p-8">
                    <div className="flex items-start space-x-4">
                      <div className="bg-[#E5E5E3] rounded-lg p-3 shrink-0">
                        <Lock className="w-8 h-8 text-[#5A5A5A]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] mb-2">Final Exam Locked</h3>
                        <p className="text-sm sm:text-base text-[#5A5A5A] mb-4">Pass all chapter tests to unlock the final exam</p>
                        <div className="bg-[#F7F7F5] rounded-lg p-4 border border-[#E5E5E3]">
                          <p className="text-sm text-[#5A5A5A]">
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
                  <div className="bg-white border border-[#E5E5E3] border-l-4 border-l-[#1B3A5C] rounded-xl shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <Award className="w-12 h-12 text-[#1B3A5C] shrink-0" strokeWidth={1.5} />
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2">Final Exam Ready!</h3>
                          <p className="text-sm sm:text-base text-[#5A5A5A] mb-3">You've completed all chapters. Take the final exam to earn your certificates!</p>
                          {progress.finalExam.attempts.length > 0 && (
                            <div className="bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg p-3">
                              <p className="text-sm text-[#5A5A5A]">
                                Best Score: <span className="font-bold text-[#2C2C2C]">{progress.finalExam.bestScore}%</span> • Attempts: <span className="font-bold text-[#2C2C2C]">{progress.finalExam.attempts.length}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => navigate(`/course/${COURSE_ID}/exam`)} className="bg-[#1B3A5C] text-white px-6 sm:px-8 py-3 rounded-lg font-bold hover:bg-[#16304d] transition-all flex items-center space-x-2 group shrink-0 cursor-pointer">
                        <Award className="w-6 h-6" />
                        <span>Take Final Exam</span>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
