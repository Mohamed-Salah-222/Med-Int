import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, Lock, Target } from "lucide-react";

interface LessonItem {
  _id: string;
  title: string;
  lessonNumber: number;
}

interface LessonSidebarProps {
  chapterTitle: string;
  chapterNumber: number;
  chapterId: string;
  lessons: LessonItem[];
  currentLessonId: string;
  completedLessonIds?: string[];
  userRole?: string;
}

function LessonSidebar({ chapterTitle, chapterNumber, chapterId, lessons, currentLessonId, completedLessonIds = [], userRole }: LessonSidebarProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Check if user is admin/supervisor
  const isAdminOrSupervisor = userRole === "Admin" || userRole === "SuperVisor";

  // Check if all lessons are completed OR user is admin/supervisor
  const allLessonsCompleted = isAdminOrSupervisor || lessons.every((lesson) => completedLessonIds.includes(lesson._id));

  return (
    <>
      {/* Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} className={`fixed top-20 z-50 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-4 py-3 rounded-r-xl shadow-lg hover:shadow-xl transition-all duration-300 ${isOpen ? "left-[280px]" : "left-0"}`} aria-label={isOpen ? "Hide lesson sidebar" : "Show lesson sidebar"}>
        <div className="flex items-center space-x-2">
          {isOpen ? (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Hide</span>
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-semibold">Lessons</span>
            </>
          )}
        </div>
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl border-r border-[#E8E8E6] transition-all duration-300 ease-in-out z-40 ${isOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ width: "280px", paddingTop: "80px" }}>
        <div className="h-full overflow-y-auto px-3 pb-8 scrollbar-thin scrollbar-thumb-[#7A9D96] scrollbar-track-gray-100">
          {/* Chapter Header */}
          <div className="mb-4 pb-3 border-b border-[#E8E8E6]">
            <div className="flex items-center mb-1">
              <BookOpen className="w-4 h-4 text-[#7A9D96] mr-1.5" />
              <span className="text-xs font-semibold text-[#6B6B6B]">CHAPTER {chapterNumber}</span>
            </div>
            <h3 className="text-base font-bold text-[#2C2C2C] leading-tight">{chapterTitle}</h3>
          </div>

          {/* Lessons List */}
          <div className="space-y-1.5">
            {lessons.map((lesson, index) => {
              const isCompleted = completedLessonIds.includes(lesson._id);
              const isCurrent = lesson._id === currentLessonId;

              // Admin/SuperVisor bypass - never locked
              const isLocked = !isAdminOrSupervisor && index > 0 && !completedLessonIds.includes(lessons[index - 1]._id);

              return (
                <button
                  key={lesson._id}
                  onClick={() => !isLocked && navigate(`/lesson/${lesson._id}`)}
                  disabled={isLocked}
                  className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 ${isCurrent ? "bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white shadow-md scale-105" : isLocked ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60" : "hover:bg-[#7A9D96]/5 border border-transparent hover:border-[#7A9D96]/20"}`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="flex-shrink-0 mt-0.5">{isCompleted ? <CheckCircle className="w-4 h-4 text-green-600" /> : isLocked ? <Lock className="w-4 h-4 text-gray-400" /> : <div className={`w-4 h-4 rounded-full border-2 ${isCurrent ? "border-white bg-white/20" : "border-[#7A9D96]"}`} />}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-bold mb-0.5 uppercase tracking-wide ${isCurrent ? "text-white/90" : "text-[#6B6B6B]"}`}>Lesson {lesson.lessonNumber}</div>
                      <div className={`text-xs font-medium leading-tight line-clamp-2 ${isCurrent ? "text-white" : isLocked ? "text-gray-400" : "text-[#2C2C2C]"}`}>{lesson.title}</div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Chapter Test */}
            <div className="pt-3 mt-3 border-t border-[#E8E8E6]">
              <button
                onClick={() => allLessonsCompleted && navigate(`/chapter/${chapterId}/test`)}
                disabled={!allLessonsCompleted}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${allLessonsCompleted ? "bg-gradient-to-r from-[#2C2C2C] to-[#1A1A1A] text-white shadow-md hover:shadow-xl hover:from-[#3A3A3A] hover:to-[#2C2C2C] hover:scale-105" : "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"}`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className="flex-shrink-0 mt-0.5">{allLessonsCompleted ? <Target className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-gray-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-bold mb-0.5 uppercase tracking-wide ${allLessonsCompleted ? "text-white/90" : "text-[#6B6B6B]"}`}>Chapter Test</div>
                    <div className={`text-sm font-bold leading-tight ${allLessonsCompleted ? "text-white" : "text-gray-400"}`}>Take Chapter {chapterNumber} Test</div>
                    {!allLessonsCompleted && <div className="text-[10px] text-gray-500 mt-1">Complete all lessons first</div>}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default LessonSidebar;
