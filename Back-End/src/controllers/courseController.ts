import { Request, Response, NextFunction } from "express";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Question from "../models/Question";
import Lesson from "../models/Lesson";
import UserProgress from "../models/UserProgress";
import Certificate from "../models/Certificate";
import User from "../models/User";
import { generateCertificateNumber, generateVerificationCode } from "../utils/certificateGenerator";
import { sendCertificateEmail } from "../utils/emailService";
import TestSession from "../models/TestSession";
import { generateCertificate } from "../services/certificateGenerator";

//*=====================================================
//* TYPE DEFINITIONS
//*=====================================================

interface SubmitQuizBody {
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

interface SubmitTestBody {
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

interface SubmitExamBody {
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

//*=====================================================
//* UTILITY FUNCTIONS
//*=====================================================

//*--- Get or Create User Progress Record
const getOrCreateProgress = async (userId: string, courseId: string) => {
  let progress = await UserProgress.findOne({ userId, courseId });

  if (!progress) {
    progress = await UserProgress.create({
      userId,
      courseId,
      currentChapterNumber: 1,
      currentLessonNumber: 1,
      completedLessons: [],
      chapterTestAttempts: [],
      chapterTestCooldowns: [],
      finalExamAttempts: [],
      courseCompleted: false,
      certificateIssued: false,
    });
  }

  return progress;
};

//*=====================================================
//* COURSE & CONTENT RETRIEVAL
//*=====================================================

//*--- Get Course with Published Chapters and Lessons
export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate({
      path: "chapters",
      select: "title description chapterNumber isPublished",
      match: { isPublished: true },
      populate: {
        path: "lessons",
        select: "title lessonNumber isPublished",
        match: { isPublished: true },
      },
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Map chapters with their published lessons
    const chaptersWithLessons = course.chapters.map((chapter: any) => ({
      _id: chapter._id,
      title: chapter.title,
      description: chapter.description,
      chapterNumber: chapter.chapterNumber,
      lessons: chapter.lessons || [],
    }));

    res.status(200).json({
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        totalChapters: chaptersWithLessons.length,
        chapters: chaptersWithLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Chapter with Published Lessons and Test Info
export const getChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id).populate({
      path: "lessons",
      select: "title lessonNumber contentType isPublished",
    });

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Filter published lessons only
    const publishedLessons = chapter.lessons.filter((lesson: any) => lesson.isPublished);

    res.status(200).json({
      chapter: {
        id: chapter._id,
        title: chapter.title,
        description: chapter.description,
        chapterNumber: chapter.chapterNumber,
        totalLessons: publishedLessons.length,
        lessons: publishedLessons,
        chapterTest: {
          totalQuestions: chapter.chapterTest.questions.length,
          passingScore: chapter.chapterTest.passingScore,
          timeLimit: chapter.chapterTest.timeLimit,
          cooldownHours: chapter.chapterTest.cooldownHours,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Lesson Content with Chapter Context
export const getLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id).populate({
      path: "chapterId",
      select: "title chapterNumber _id",
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // Check if lesson is published
    if (!lesson.isPublished) {
      res.status(403).json({ message: "This lesson is not published yet" });
      return;
    }

    // Get all published lessons in this chapter for sidebar navigation
    const chapterLessons = await Lesson.find({
      chapterId: lesson.chapterId,
      isPublished: true,
    })
      .select("_id title lessonNumber")
      .sort({ lessonNumber: 1 });

    res.status(200).json({
      lesson: {
        id: lesson._id,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        content: lesson.content,
        contentType: lesson.contentType,
        audioUrl: lesson.audioUrl,
      },
      chapter: {
        id: (lesson.chapterId as any)._id,
        title: (lesson.chapterId as any).title,
        chapterNumber: (lesson.chapterId as any).chapterNumber,
        lessons: chapterLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* LESSON QUIZ HANDLING
//*=====================================================

//*--- Get Lesson Quiz Questions (Randomized)
export const getLessonQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (!lesson.isPublished) {
      res.status(403).json({ message: "This lesson is not published yet" });
      return;
    }

    // Fetch questions (exclude correct answers)
    const questions = await Question.find({
      _id: { $in: lesson.quiz.questions },
    }).select("-correctAnswer -explanation");

    // Randomize options for each question
    const randomizedQuestions = questions.map((q) => {
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      return {
        _id: q._id,
        questionText: q.questionText,
        options: shuffledOptions,
        type: q.type,
        difficulty: q.difficulty,
      };
    });

    res.status(200).json({
      quiz: {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        questions: randomizedQuestions,
        totalQuestions: randomizedQuestions.length,
        passingScore: lesson.quiz.passingScore,
        unlimitedAttempts: lesson.quiz.unlimitedAttempts,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Submit Lesson Quiz Answers
export const submitLessonQuiz = async (req: Request<{ id: string }, {}, SubmitQuizBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // Fetch questions with correct answers
    const questions = await Question.find({
      _id: { $in: lesson.quiz.questions },
    });

    if (questions.length === 0) {
      res.status(400).json({ message: "No quiz questions found for this lesson" });
      return;
    }

    // Calculate score
    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const question = questions.find((q) => q._id.toString() === answer.questionId);

      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;

        results.push({
          questionId: question._id,
          questionText: question.questionText,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        });
      }
    }

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= lesson.quiz.passingScore;

    // Find next lesson ID (for navigation)
    let nextLessonId = null;
    if (passed) {
      const chapter = await Chapter.findById(lesson.chapterId).populate("lessons");

      if (chapter) {
        // Find current lesson index in the chapter
        const currentLessonIndex = chapter.lessons.findIndex((l: any) => l._id.toString() === id);

        // Check if there's a next lesson in this chapter
        if (currentLessonIndex !== -1 && currentLessonIndex < chapter.lessons.length - 1) {
          const nextLesson = chapter.lessons[currentLessonIndex + 1] as any;

          if (nextLesson.isPublished) {
            nextLessonId = nextLesson._id.toString();
          }
        } else {
          // No more lessons in this chapter, check for next chapter
          const course = await Course.findById(chapter.courseId).populate({
            path: "chapters",
            populate: {
              path: "lessons",
              match: { isPublished: true },
            },
          });

          if (course) {
            const currentChapterIndex = course.chapters.findIndex((ch: any) => ch._id.toString() === chapter._id.toString());

            // Check if there's a next chapter
            if (currentChapterIndex !== -1 && currentChapterIndex < course.chapters.length - 1) {
              const nextChapter = course.chapters[currentChapterIndex + 1] as any;
              if (nextChapter.isPublished && nextChapter.lessons?.length > 0) {
                nextLessonId = nextChapter.lessons[0]._id.toString();
              }
            }
          }
        }

        // Update user progress
        const progress = await getOrCreateProgress(userId, chapter.courseId.toString());

        // Check if lesson already completed
        const existingLesson = progress.completedLessons.find((cl: any) => cl.lessonId.toString() === id);

        if (!existingLesson) {
          // First time passing this lesson
          progress.completedLessons.push({
            lessonId: id as any,
            completedAt: new Date(),
            quizScore: correctCount,
            attempts: 1,
            passed: true,
          } as any);
        } else {
          // Update attempts count
          existingLesson.attempts += 1;
          existingLesson.quizScore = correctCount;
          existingLesson.completedAt = new Date();
        }

        await progress.save();
      }
    }

    // Determine next action after quiz completion
    let nextAction: any = null;

    if (passed) {
      const chapter = await Chapter.findById(lesson.chapterId).populate("lessons");

      if (chapter) {
        const progress = await getOrCreateProgress(userId, chapter.courseId.toString());

        // Get user for admin check
        const user = await User.findById(userId);
        const isAdminOrSupervisor = user?.role === "Admin" || user?.role === "SuperVisor";

        // Find current lesson index
        const currentLessonIndex = chapter.lessons.findIndex((l: any) => l._id.toString() === id);

        // Check if there's a next lesson in this chapter
        if (currentLessonIndex !== -1 && currentLessonIndex < chapter.lessons.length - 1) {
          const nextLesson = chapter.lessons[currentLessonIndex + 1] as any;

          if (nextLesson.isPublished) {
            nextAction = {
              type: "lesson",
              chapterNumber: chapter.chapterNumber,
              lessonNumber: nextLesson.lessonNumber,
              lessonId: nextLesson._id.toString(),
              title: nextLesson.title,
              message: `Continue with Lesson ${nextLesson.lessonNumber}: ${nextLesson.title}`,
            };
          }
        } else {
          // No more lessons in this chapter - check if chapter test is done
          const chapterTestAttempt = progress.chapterTestAttempts.find((attempt: any) => attempt.chapterId.toString() === chapter._id.toString());

          if (!chapterTestAttempt || !chapterTestAttempt.passed) {
            // Chapter test not passed - direct to test
            nextAction = {
              type: "chapter-test",
              chapterNumber: chapter.chapterNumber,
              chapterId: chapter._id.toString(),
              title: chapter.title,
              message: `Take Chapter ${chapter.chapterNumber} Test`,
            };
          } else {
            // Chapter test passed - check next chapter
            const course = await Course.findById(chapter.courseId).populate({
              path: "chapters",
              populate: {
                path: "lessons",
                match: { isPublished: true },
              },
            });

            if (course) {
              const currentChapterIndex = course.chapters.findIndex((ch: any) => ch._id.toString() === chapter._id.toString());

              // Check if there's a next chapter
              if (currentChapterIndex !== -1 && currentChapterIndex < course.chapters.length - 1) {
                const nextChapter = course.chapters[currentChapterIndex + 1] as any;

                if (nextChapter.isPublished) {
                  // Check if next chapter intro has been viewed
                  const nextChapterIntroViewed = progress.viewedChapterIntros?.some((chId: any) => chId.toString() === nextChapter._id.toString());

                  if (!nextChapterIntroViewed && !isAdminOrSupervisor) {
                    nextAction = {
                      type: "chapter-intro",
                      chapterNumber: nextChapter.chapterNumber,
                      chapterId: nextChapter._id.toString(),
                      title: nextChapter.title,
                      message: `Start Chapter ${nextChapter.chapterNumber}: ${nextChapter.title}`,
                    };
                  } else if (nextChapter.lessons?.length > 0) {
                    nextAction = {
                      type: "lesson",
                      chapterNumber: nextChapter.chapterNumber,
                      lessonNumber: nextChapter.lessons[0].lessonNumber,
                      lessonId: nextChapter.lessons[0]._id.toString(),
                      title: nextChapter.lessons[0].title,
                      message: `Continue with Lesson ${nextChapter.lessons[0].lessonNumber}: ${nextChapter.lessons[0].title}`,
                    };
                  }
                }
              } else {
                // No more chapters - check final exam
                const allChaptersPassed = course.chapters.every((ch: any) => {
                  return progress.chapterTestAttempts.some((attempt: any) => attempt.chapterId.toString() === ch._id.toString() && attempt.passed);
                });

                const finalExamPassed = progress.finalExamAttempts.some((attempt: any) => attempt.passed);

                if (allChaptersPassed && !finalExamPassed) {
                  nextAction = {
                    type: "final-exam",
                    message: "Take the Final Exam to earn your certificates",
                  };
                } else if (finalExamPassed) {
                  nextAction = {
                    type: "completed",
                    message: "Congratulations! You've completed the course.",
                  };
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      score,
      correctCount,
      totalQuestions,
      passed,
      passingScore: lesson.quiz.passingScore,
      results,
      nextAction,
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* PROGRESS TRACKING
//*=====================================================

//*--- Get User Progress Summary
export const getUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { courseId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const progress = await getOrCreateProgress(userId, courseId);

    // Check if final exam was passed
    const finalExamPassed = progress.finalExamAttempts.some((attempt: any) => attempt.passed);

    res.status(200).json({
      progress: {
        currentChapter: progress.currentChapterNumber,
        currentLesson: progress.currentLessonNumber,
        completedLessons: progress.completedLessons.length,
        chapterTestsCompleted: progress.chapterTestAttempts.filter((attempt: any) => attempt.passed).length,
        finalExamPassed: finalExamPassed,
        courseCompleted: progress.courseCompleted,
        certificateIssued: progress.certificateIssued,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Detailed Progress Breakdown
export const getDetailedProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const progress = await getOrCreateProgress(userId, courseId);

    // Check if user is Admin or SuperVisor
    const user = await User.findById(userId);
    const isAdminOrSupervisor = user?.role === "Admin" || user?.role === "SuperVisor";

    // Get course with chapters and lessons
    const course = await Course.findById(courseId).populate({
      path: "chapters",
      populate: {
        path: "lessons",
        select: "title lessonNumber isPublished",
      },
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Build detailed progress per chapter
    const chapters = course.chapters as any[];

    // First pass: build basic chapter data
    const chaptersProgressTemp = chapters.map((chapter) => {
      const lessons = chapter.lessons || [];

      const lessonsProgress = lessons.map((lesson: any) => {
        const completed = progress.completedLessons.find((cl: any) => cl.lessonId.toString() === lesson._id.toString());

        return {
          lessonId: lesson._id,
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          completed: !!completed,
          quizScore: completed?.quizScore || 0,
          attempts: completed?.attempts || 0,
          completedAt: completed?.completedAt || null,
        };
      });

      const chapterTestAttempt = progress.chapterTestAttempts.find((attempt: any) => attempt.chapterId.toString() === chapter._id.toString());

      const allLessonsCompleted = lessonsProgress.every((lp: any) => lp.completed);
      const testPassed = chapterTestAttempt?.passed || false;

      // Check if intro viewed
      const introViewed = progress.viewedChapterIntros?.some((chId: any) => chId.toString() === chapter._id.toString()) || false;

      return {
        chapterId: chapter._id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        description: chapter.description,
        totalLessons: lessonsProgress.length,
        completedLessons: lessonsProgress.filter((lp: any) => lp.completed).length,
        allLessonsCompleted,
        testTaken: !!chapterTestAttempt,
        testPassed,
        testScore: chapterTestAttempt?.score || null,
        testAttemptedAt: chapterTestAttempt?.attemptedAt || null,
        lessons: lessonsProgress,
        introViewed,
        isUnlocked: false, // Will be set in next pass
      };
    });

    // Second pass: determine unlock status
    const chaptersProgress = chaptersProgressTemp.map((chapter, index) => {
      let isUnlocked = false;

      if (isAdminOrSupervisor) {
        // Admins can access everything
        isUnlocked = true;
      } else if (index === 0) {
        // First chapter always unlocked
        isUnlocked = true;
      } else {
        // Chapter unlocked if previous chapter test is passed
        const prevChapter = chaptersProgressTemp[index - 1];
        isUnlocked = prevChapter.testPassed;
      }

      return {
        ...chapter,
        isUnlocked,
      };
    });

    // Determine next action
    let nextAction: any = null;

    for (const chapter of chaptersProgress) {
      // Skip locked chapters (unless admin)
      if (!chapter.isUnlocked && !isAdminOrSupervisor) {
        continue;
      }

      // Check if intro needs to be viewed
      if (!chapter.introViewed && !isAdminOrSupervisor) {
        nextAction = {
          type: "chapter-intro",
          chapterNumber: chapter.chapterNumber,
          chapterId: chapter.chapterId,
          title: chapter.title,
          message: `Start Chapter ${chapter.chapterNumber}: ${chapter.title}`,
        };
        break;
      }

      // Check for incomplete lessons
      const nextLesson = chapter.lessons.find((l: any) => !l.completed);
      if (nextLesson) {
        nextAction = {
          type: "lesson",
          chapterNumber: chapter.chapterNumber,
          lessonNumber: nextLesson.lessonNumber,
          lessonId: nextLesson.lessonId,
          title: nextLesson.title,
          message: `Continue with Lesson ${nextLesson.lessonNumber}: ${nextLesson.title}`,
        };
        break;
      }

      // All lessons done, but test not passed
      if (chapter.allLessonsCompleted && !chapter.testPassed) {
        nextAction = {
          type: "chapter-test",
          chapterNumber: chapter.chapterNumber,
          chapterId: chapter.chapterId,
          title: chapter.title,
          message: `Take Chapter ${chapter.chapterNumber} Test`,
        };
        break;
      }
    }

    // All chapters done, check final exam
    if (!nextAction) {
      const allChaptersPassed = chaptersProgress.every((c: any) => c.testPassed);
      const finalExamPassed = progress.finalExamAttempts.some((attempt: any) => attempt.passed);

      if (allChaptersPassed && !finalExamPassed) {
        nextAction = {
          type: "final-exam",
          message: "Take the Final Exam to earn your certificates",
        };
      } else if (finalExamPassed) {
        nextAction = {
          type: "completed",
          message: "Congratulations! You've completed the course.",
        };
      }
    }

    // Final exam attempts summary
    const finalExamAttempts = progress.finalExamAttempts.map((attempt: any) => ({
      score: attempt.score,
      passed: attempt.passed,
      attemptedAt: attempt.attemptedAt,
    }));

    res.status(200).json({
      progress: {
        currentChapter: progress.currentChapterNumber,
        currentLesson: progress.currentLessonNumber,
        courseCompleted: progress.courseCompleted,
        certificateIssued: progress.certificateIssued,
        completedAt: progress.completedAt,
        chapters: chaptersProgress,
        finalExam: {
          attempts: finalExamAttempts,
          passed: progress.finalExamAttempts.some((a: any) => a.passed),
          bestScore: Math.max(...finalExamAttempts.map((a: any) => a.score), 0),
        },
        nextAction,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* CHAPTER TEST HANDLING
//*=====================================================

//*--- Start Chapter Test Session
export const startChapterTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // chapter ID
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Admin/SuperVisor bypass
    const userRole = req.user?.role;
    const isAdminOrSupervisor = userRole === "Admin" || userRole === "SuperVisor";

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.isPublished) {
      res.status(403).json({ message: "This chapter is not published yet" });
      return;
    }

    // Check if there's an active session already
    const existingSession = await TestSession.findOne({
      userId,
      chapterId: id,
      isActive: true,
      isSubmitted: false,
    });

    if (existingSession) {
      res.status(400).json({
        message: "You already have an active test session",
        sessionId: existingSession._id,
      });
      return;
    }

    // Only check requirements for regular users
    if (!isAdminOrSupervisor) {
      const progress = await getOrCreateProgress(userId, chapter.courseId.toString());

      // Check if user completed all lessons in this chapter
      const chapterLessons = await Lesson.find({ chapterId: id });
      const completedLessonIds = progress.completedLessons.map((cl: any) => cl.lessonId.toString());
      const allLessonsCompleted = chapterLessons.every((lesson) => completedLessonIds.includes(lesson._id.toString()));

      if (!allLessonsCompleted) {
        res.status(403).json({
          message: "You must complete all lessons in this chapter before taking the test",
        });
        return;
      }

      // Check cooldown
      const cooldown = progress.chapterTestCooldowns.find((cd: any) => cd.chapterId.toString() === id);

      if (cooldown) {
        const cooldownHours = chapter.chapterTest.cooldownHours;
        const timeSinceLastAttempt = Date.now() - new Date(cooldown.lastAttemptAt).getTime();
        const cooldownMs = cooldownHours * 60 * 60 * 1000;

        if (timeSinceLastAttempt < cooldownMs) {
          const remainingMs = cooldownMs - timeSinceLastAttempt;
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

          res.status(403).json({
            message: "Test is on cooldown",
            remainingMinutes,
            canRetakeAt: new Date(Date.now() + remainingMs),
          });
          return;
        }
      }
    }

    // Fetch all questions
    const allQuestions = await Question.find({
      _id: { $in: chapter.chapterTest.questions },
    }).select("-correctAnswer -explanation");

    // Randomly select 20 questions (or all if less than 20)
    const questionsToUse = allQuestions.length > 20 ? allQuestions.sort(() => Math.random() - 0.5).slice(0, 20) : allQuestions;

    // Randomize options for each question
    const randomizedQuestions = questionsToUse.map((q) => {
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      return {
        _id: q._id,
        questionText: q.questionText,
        options: shuffledOptions,
        type: q.type,
        difficulty: q.difficulty,
      };
    });

    // Create test session (40 minutes expiry)
    const session = await TestSession.create({
      userId,
      chapterId: id,
      testType: "chapter",
      questions: randomizedQuestions.map((q) => q._id),
      answers: randomizedQuestions.map((q) => ({
        questionId: q._id,
        selectedAnswer: null,
        timeSpent: 0,
      })),
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 40 * 60 * 1000),
      isActive: true,
    });

    res.status(200).json({
      sessionId: session._id,
      test: {
        chapterId: chapter._id,
        chapterTitle: chapter.title,
        questions: randomizedQuestions,
        totalQuestions: randomizedQuestions.length,
        passingScore: chapter.chapterTest.passingScore,
        timePerQuestion: 60,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Chapter Test Questions (Legacy - uses session now)
export const getChapterTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // chapter ID
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Admin/SuperVisor bypass
    const userRole = req.user?.role;
    const isAdminOrSupervisor = userRole === "Admin" || userRole === "SuperVisor";

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.isPublished) {
      res.status(403).json({ message: "This chapter is not published yet" });
      return;
    }

    // Only check requirements for regular users
    if (!isAdminOrSupervisor) {
      const progress = await getOrCreateProgress(userId, chapter.courseId.toString());
      const chapterLessons = await Lesson.find({ chapterId: id });
      const completedLessonIds = progress.completedLessons.map((cl: any) => cl.lessonId.toString());
      const allLessonsCompleted = chapterLessons.every((lesson) => completedLessonIds.includes(lesson._id.toString()));

      if (!allLessonsCompleted) {
        res.status(403).json({
          message: "You must complete all lessons in this chapter before taking the test",
        });
        return;
      }

      // Check cooldown
      const cooldown = progress.chapterTestCooldowns.find((cd: any) => cd.chapterId.toString() === id);

      if (cooldown) {
        const cooldownHours = chapter.chapterTest.cooldownHours;
        const timeSinceLastAttempt = Date.now() - new Date(cooldown.lastAttemptAt).getTime();
        const cooldownMs = cooldownHours * 60 * 60 * 1000;

        if (timeSinceLastAttempt < cooldownMs) {
          const remainingMs = cooldownMs - timeSinceLastAttempt;
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

          res.status(403).json({
            message: "Test is on cooldown",
            remainingMinutes,
            canRetakeAt: new Date(Date.now() + remainingMs),
          });
          return;
        }
      }
    }

    // Fetch questions
    const allQuestions = await Question.find({
      _id: { $in: chapter.chapterTest.questions },
    }).select("-correctAnswer -explanation");

    const questionsToUse = allQuestions.length > 20 ? allQuestions.sort(() => Math.random() - 0.5).slice(0, 20) : allQuestions;

    const randomizedQuestions = questionsToUse.map((q) => {
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      return {
        _id: q._id,
        questionText: q.questionText,
        options: shuffledOptions,
        type: q.type,
        difficulty: q.difficulty,
      };
    });

    res.status(200).json({
      test: {
        chapterId: chapter._id,
        chapterTitle: chapter.title,
        questions: randomizedQuestions,
        totalQuestions: randomizedQuestions.length,
        passingScore: chapter.chapterTest.passingScore,
        timeLimit: chapter.chapterTest.timeLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Submit Chapter Test Answers
export const submitChapterTest = async (req: Request<{ id: string }, {}, { sessionId: string; answers: any[] }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // chapter ID
    const { sessionId, answers } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify session exists and belongs to user
    const session = await TestSession.findOne({
      _id: sessionId,
      userId,
      chapterId: id,
    });

    if (!session) {
      res.status(404).json({ message: "Test session not found" });
      return;
    }

    if (session.isSubmitted) {
      res.status(400).json({ message: "Test already submitted" });
      return;
    }

    if (session.isAbandoned) {
      res.status(400).json({ message: "Test was abandoned" });
      return;
    }

    if (!session.isActive) {
      res.status(400).json({ message: "Test session expired" });
      return;
    }

    // Mark session as submitted
    session.isSubmitted = true;
    session.isActive = false;
    await session.save();

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Fetch questions with correct answers
    const questions = await Question.find({
      _id: { $in: session.questions },
    });

    // Calculate score
    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const question = questions.find((q) => q._id.toString() === answer.questionId);

      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;

        results.push({
          questionId: question._id,
          questionText: question.questionText,
          selectedAnswer: answer.selectedAnswer || "No answer",
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        });
      }
    }

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= chapter.chapterTest.passingScore;

    // Update progress
    const progress = await getOrCreateProgress(userId, chapter.courseId.toString());

    progress.chapterTestAttempts.push({
      chapterId: id as any,
      attemptedAt: new Date(),
      score: correctCount,
      passed,
    } as any);

    // Update cooldown
    const existingCooldown = progress.chapterTestCooldowns.find((cd: any) => cd.chapterId.toString() === id);

    if (existingCooldown) {
      existingCooldown.lastAttemptAt = new Date();
    } else {
      progress.chapterTestCooldowns.push({
        chapterId: id as any,
        lastAttemptAt: new Date(),
      } as any);
    }

    await progress.save();

    res.status(200).json({
      score,
      correctCount,
      totalQuestions,
      passed,
      passingScore: chapter.chapterTest.passingScore,
      results,
    });
  } catch (error) {
    next(error);
  }
};

//*--- Abandon Chapter Test (Triggers Cooldown)
export const abandonChapterTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // chapter ID
    const { sessionId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await TestSession.findOne({
      _id: sessionId,
      userId,
      chapterId: id,
    });

    if (!session) {
      res.status(404).json({ message: "Test session not found" });
      return;
    }

    if (session.isSubmitted) {
      res.status(400).json({ message: "Test already submitted" });
      return;
    }

    // Mark as abandoned
    session.isAbandoned = true;
    session.isActive = false;
    await session.save();

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Trigger cooldown
    const progress = await getOrCreateProgress(userId, chapter.courseId.toString());

    const existingCooldown = progress.chapterTestCooldowns.find((cd: any) => cd.chapterId.toString() === id);

    if (existingCooldown) {
      existingCooldown.lastAttemptAt = new Date();
    } else {
      progress.chapterTestCooldowns.push({
        chapterId: id as any,
        lastAttemptAt: new Date(),
      } as any);
    }

    await progress.save();

    res.status(200).json({
      message: "Test abandoned. 3-hour cooldown activated.",
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* FINAL EXAM HANDLING
//*=====================================================

//*--- Start Final Exam Session
export const startFinalExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // course ID
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Admin/SuperVisor bypass
    const userRole = req.user?.role;
    const isAdminOrSupervisor = userRole === "Admin" || userRole === "SuperVisor";

    const course = await Course.findById(id).populate({
      path: "chapters",
      populate: {
        path: "lessons",
      },
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (!course.isPublished) {
      res.status(403).json({ message: "This course is not published yet" });
      return;
    }

    // Check if there's an active session already
    const existingSession = await TestSession.findOne({
      userId,
      courseId: id,
      testType: "final",
      isActive: true,
      isSubmitted: false,
    });

    if (existingSession) {
      res.status(400).json({
        message: "You already have an active exam session",
        sessionId: existingSession._id,
      });
      return;
    }

    // Only check requirements for regular users
    if (!isAdminOrSupervisor) {
      const progress = await getOrCreateProgress(userId, id);
      const chapters = course.chapters as any[];

      // Check 1: All lessons must be completed
      const allLessons: any[] = [];
      chapters.forEach((chapter) => {
        if (chapter.lessons) {
          allLessons.push(...chapter.lessons);
        }
      });

      const completedLessonIds = progress.completedLessons.map((cl: any) => cl.lessonId.toString());
      const allLessonsCompleted = allLessons.every((lesson) => completedLessonIds.includes(lesson._id.toString()));

      if (!allLessonsCompleted) {
        res.status(403).json({
          message: "You must complete all lessons before taking the final exam",
        });
        return;
      }

      // Check 2: All chapter tests must be passed
      const passedChapterTests = progress.chapterTestAttempts.filter((attempt: any) => attempt.passed);
      const allChaptersPassed = chapters.every((chapter) => passedChapterTests.some((attempt: any) => attempt.chapterId.toString() === chapter._id.toString()));

      if (!allChaptersPassed) {
        res.status(403).json({
          message: "You must pass all chapter tests before taking the final exam",
        });
        return;
      }

      // Check cooldown
      if (progress.finalExamCooldown?.lastAttemptAt) {
        const cooldownHours = course.finalExam.cooldownHours;
        const timeSinceLastAttempt = Date.now() - new Date(progress.finalExamCooldown.lastAttemptAt).getTime();
        const cooldownMs = cooldownHours * 60 * 60 * 1000;

        if (timeSinceLastAttempt < cooldownMs) {
          const remainingMs = cooldownMs - timeSinceLastAttempt;
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

          res.status(403).json({
            message: "Final exam is on cooldown",
            remainingMinutes,
            canRetakeAt: new Date(Date.now() + remainingMs),
          });
          return;
        }
      }
    }

    // Fetch ALL questions assigned to final exam
    const allQuestions = await Question.find({
      _id: { $in: course.finalExam.questions as any },
    }).select("-correctAnswer -explanation");

    // Randomly select 100 questions
    const EXAM_QUESTION_COUNT = 100;
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(EXAM_QUESTION_COUNT, shuffledQuestions.length));

    // Randomize options for each question
    const randomizedQuestions = selectedQuestions.map((q) => {
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      return {
        _id: q._id,
        questionText: q.questionText,
        options: shuffledOptions,
        type: q.type,
        difficulty: q.difficulty,
      };
    });

    // Create exam session (100 minutes expiry - 1 min per question)
    const session = await TestSession.create({
      userId,
      courseId: id,
      testType: "final",
      questions: randomizedQuestions.map((q) => q._id),
      answers: randomizedQuestions.map((q) => ({
        questionId: q._id,
        selectedAnswer: null,
        timeSpent: 0,
      })),
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 100 * 60 * 1000), // 100 minutes
      isActive: true,
    });

    res.status(200).json({
      sessionId: session._id,
      exam: {
        courseId: course._id,
        courseTitle: course.title,
        questions: randomizedQuestions,
        totalQuestions: randomizedQuestions.length,
        passingScore: course.finalExam.passingScore,
        timePerQuestion: 60,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Abandon Final Exam (Triggers Cooldown)
export const abandonFinalExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // course ID
    const { sessionId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await TestSession.findOne({
      _id: sessionId,
      userId,
      courseId: id,
      testType: "final",
    });

    if (!session) {
      res.status(404).json({ message: "Exam session not found" });
      return;
    }

    if (session.isSubmitted) {
      res.status(400).json({ message: "Exam already submitted" });
      return;
    }

    // Mark as abandoned
    session.isAbandoned = true;
    session.isActive = false;
    await session.save();

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Trigger cooldown
    const progress = await getOrCreateProgress(userId, id);

    if (!progress.finalExamCooldown) {
      progress.finalExamCooldown = { lastAttemptAt: new Date() } as any;
    } else {
      progress.finalExamCooldown.lastAttemptAt = new Date();
    }

    await progress.save();

    res.status(200).json({
      message: "Final exam abandoned. 24-hour cooldown activated.",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Submit Final Exam + Generate Certificates
export const submitFinalExam = async (req: Request<{ id: string }, {}, { sessionId: string; answers: any[] }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // course ID
    const { sessionId, answers } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify session exists and belongs to user
    const session = await TestSession.findOne({
      _id: sessionId,
      userId,
      courseId: id,
      testType: "final",
    });

    if (!session) {
      res.status(404).json({ message: "Exam session not found" });
      return;
    }

    if (session.isSubmitted) {
      res.status(400).json({ message: "Exam already submitted" });
      return;
    }

    if (session.isAbandoned) {
      res.status(400).json({ message: "Exam was abandoned" });
      return;
    }

    if (!session.isActive) {
      res.status(400).json({ message: "Exam session expired" });
      return;
    }

    // Mark session as submitted
    session.isSubmitted = true;
    session.isActive = false;
    await session.save();

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Get progress
    const progress = await getOrCreateProgress(userId, id);

    // Fetch questions with correct answers (from session questions)
    const questions = await Question.find({
      _id: { $in: session.questions },
    });

    if (questions.length === 0) {
      res.status(400).json({ message: "No exam questions found" });
      return;
    }

    // Calculate score
    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const question = questions.find((q) => q._id.toString() === answer.questionId);

      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;

        results.push({
          questionId: question._id,
          questionText: question.questionText,
          selectedAnswer: answer.selectedAnswer || "No answer",
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        });
      }
    }

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= course.finalExam.passingScore;

    // Record attempt
    progress.finalExamAttempts.push({
      attemptedAt: new Date(),
      score: correctCount,
      passed,
    } as any);

    // Update cooldown
    if (!progress.finalExamCooldown) {
      progress.finalExamCooldown = { lastAttemptAt: new Date() } as any;
    } else {
      progress.finalExamCooldown.lastAttemptAt = new Date();
    }

    // If passed and not completed, issue certificates
    if (passed && !progress.courseCompleted) {
      progress.courseCompleted = true;
      progress.completedAt = new Date();
      progress.certificateIssued = true;
      progress.certificateIssuedAt = new Date();

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Generate certificate numbers and codes
      const mainCertNumber = generateCertificateNumber();
      const mainVerifCode = generateVerificationCode();
      const hipaaCertNumber = generateCertificateNumber();
      const hipaaVerifCode = generateVerificationCode();

      // Generate Medical Interpreter Certificate Image
      const mainCertificateImageUrl = await generateCertificate({
        userName: user.name,
        courseTitle: course.title,
        completionDate: new Date(),
        certificateNumber: mainCertNumber,
        verificationCode: mainVerifCode,
        finalExamScore: score,
        certificateType: "medical",
      });

      // Generate HIPAA Certificate Image
      const hipaaCertificateImageUrl = await generateCertificate({
        userName: user.name,
        courseTitle: "HIPAA for Medical Interpreters",
        completionDate: new Date(),
        certificateNumber: hipaaCertNumber,
        verificationCode: hipaaVerifCode,
        finalExamScore: score,
        certificateType: "hipaa",
      });

      // Create Main Medical Interpreter Certificate
      const mainCertificate = await Certificate.create({
        userId,
        courseId: id,
        userName: user.name,
        userEmail: user.email,
        courseTitle: course.title,
        completionDate: new Date(),
        certificateNumber: mainCertNumber,
        verificationCode: mainVerifCode,
        finalExamScore: score,
        issuedAt: new Date(),
        certificateImageUrl: mainCertificateImageUrl,
      });

      // Create HIPAA Certificate
      const hipaaCertificate = await Certificate.create({
        userId,
        courseId: id,
        userName: user.name,
        userEmail: user.email,
        courseTitle: "HIPAA for Medical Interpreters",
        completionDate: new Date(),
        certificateNumber: hipaaCertNumber,
        verificationCode: hipaaVerifCode,
        finalExamScore: score,
        issuedAt: new Date(),
        certificateImageUrl: hipaaCertificateImageUrl,
      });

      // Send certificate email (non-blocking)
      try {
        await sendCertificateEmail(
          user.email,
          user.name,
          {
            certificateNumber: mainCertificate.certificateNumber,
            verificationCode: mainCertificate.verificationCode,
            courseTitle: mainCertificate.courseTitle,
            completionDate: mainCertificate.completionDate,
            finalExamScore: score,
          },
          {
            certificateNumber: hipaaCertificate.certificateNumber,
            verificationCode: hipaaCertificate.verificationCode,
            courseTitle: hipaaCertificate.courseTitle,
            completionDate: hipaaCertificate.completionDate,
            finalExamScore: score,
          },
        );
      } catch (emailError) {
        console.error("Failed to send certificate email:", emailError);
        // Don't fail the request if email fails
      }

      await progress.save();

      res.status(200).json({
        score,
        correctCount,
        totalQuestions,
        passed,
        passingScore: course.finalExam.passingScore,
        courseCompleted: progress.courseCompleted,
        certificateIssued: progress.certificateIssued,
        certificates: {
          main: {
            certificateNumber: mainCertificate.certificateNumber,
            verificationCode: mainCertificate.verificationCode,
            issuedAt: mainCertificate.issuedAt,
            certificateImageUrl: mainCertificate.certificateImageUrl,
          },
          hipaa: {
            certificateNumber: hipaaCertificate.certificateNumber,
            verificationCode: hipaaCertificate.verificationCode,
            issuedAt: hipaaCertificate.issuedAt,
            certificateImageUrl: hipaaCertificate.certificateImageUrl,
          },
        },
        results,
      });
      return;
    }

    await progress.save();

    // If not passed or already completed
    res.status(200).json({
      score,
      correctCount,
      totalQuestions,
      passed,
      passingScore: course.finalExam.passingScore,
      courseCompleted: progress.courseCompleted,
      certificateIssued: progress.certificateIssued,
      results,
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* CERTIFICATE MANAGEMENT
//*=====================================================

//*--- Get Single User Certificate (Legacy)
export const getUserCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const certificate = await Certificate.findOne({ userId, courseId });

    if (!certificate) {
      res.status(404).json({
        message: "Certificate not found. You may need to complete the course first.",
      });
      return;
    }

    res.status(200).json({
      certificate: {
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        completionDate: certificate.completionDate,
        finalExamScore: certificate.finalExamScore,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Both User Certificates (Main + HIPAA)
export const getUserCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Find all certificates for this user and course
    const certificates = await Certificate.find({ userId, courseId }).sort({ createdAt: 1 });

    if (certificates.length === 0) {
      res.status(404).json({
        message: "Certificates not found. You may need to complete the course first.",
      });
      return;
    }

    // Separate main and HIPAA certificates
    const mainCertificate = certificates.find((cert) => cert.courseTitle !== "HIPAA for Medical Interpreters");
    const hipaaCertificate = certificates.find((cert) => cert.courseTitle === "HIPAA for Medical Interpreters");

    res.status(200).json({
      certificates: {
        main: mainCertificate
          ? {
              certificateNumber: mainCertificate.certificateNumber,
              verificationCode: mainCertificate.verificationCode,
              userName: mainCertificate.userName,
              courseTitle: mainCertificate.courseTitle,
              completionDate: mainCertificate.completionDate,
              finalExamScore: mainCertificate.finalExamScore,
              issuedAt: mainCertificate.issuedAt,
              certificateImageUrl: mainCertificate.certificateImageUrl,
            }
          : null,
        hipaa: hipaaCertificate
          ? {
              certificateNumber: hipaaCertificate.certificateNumber,
              verificationCode: hipaaCertificate.verificationCode,
              userName: hipaaCertificate.userName,
              courseTitle: hipaaCertificate.courseTitle,
              completionDate: hipaaCertificate.completionDate,
              finalExamScore: hipaaCertificate.finalExamScore,
              issuedAt: hipaaCertificate.issuedAt,
              certificateImageUrl: hipaaCertificate.certificateImageUrl,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Verify Certificate Authenticity
export const verifyCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { certificateNumber, verificationCode } = req.query;

    if (!certificateNumber || !verificationCode) {
      res.status(400).json({ message: "Certificate number and verification code are required" });
      return;
    }

    const certificate = await Certificate.findOne({
      certificateNumber: certificateNumber as string,
      verificationCode: verificationCode as string,
    });

    if (!certificate) {
      res.status(404).json({
        valid: false,
        message: "Certificate not found or verification code is incorrect",
      });
      return;
    }

    res.status(200).json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        completionDate: certificate.completionDate,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Mark Chapter Intro as Viewed
export const markChapterIntroViewed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // chapter ID
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    const progress = await UserProgress.findOne({
      userId,
      courseId: chapter.courseId,
    });

    if (!progress) {
      res.status(404).json({ message: "Progress not found" });
      return;
    }

    // Check if already viewed
    const alreadyViewed = progress.viewedChapterIntros?.some((chId: any) => chId.toString() === id);

    if (!alreadyViewed) {
      if (!progress.viewedChapterIntros) {
        progress.viewedChapterIntros = [];
      }
      progress.viewedChapterIntros.push(chapter._id as any);
      await progress.save();
    }

    res.status(200).json({
      message: "Chapter intro viewed",
      introViewed: true,
    });
  } catch (error) {
    next(error);
  }
};
