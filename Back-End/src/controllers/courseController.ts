import { Request, Response, NextFunction } from "express";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Question from "../models/Question";
import Lesson from "../models/Lesson";
import UserProgress from "../models/UserProgress";

interface SubmitQuizBody {
  answers: {
    questionId: string;
    selectedAnswer: string; // Changed from number to string
  }[];
}

interface SubmitTestBody {
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate({
      path: "chapters",
      select: "title description chapterNumber isPublished",
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const publishedChapters = course.chapters.filter((chapter: any) => chapter.isPublished);

    res.status(200).json({
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        totalChapters: publishedChapters.length,
        chapters: publishedChapters,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

export const getLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id).select("-quiz.questions");

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (!lesson.isPublished) {
      res.status(403).json({ message: "This lesson is not published yet" });
      return;
    }

    res.status(200).json({
      lesson: {
        id: lesson._id,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        content: lesson.content,
        contentType: lesson.contentType,
        audioUrl: lesson.audioUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: lesson.quiz.questions },
    }).select("-correctAnswer -explanation"); // Don't send correct answer

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

    // Update user progress if passed
    if (passed) {
      const chapter = await Chapter.findById(lesson.chapterId);
      if (!chapter) {
        res.status(404).json({ message: "Chapter not found" });
        return;
      }

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

    res.status(200).json({
      score,
      correctCount,
      totalQuestions,
      passed,
      passingScore: lesson.quiz.passingScore,
      results,
    });
  } catch (error) {
    next(error);
  }
};

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

export const getChapterTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    if (!chapter.isPublished) {
      res.status(403).json({ message: "This chapter is not published yet" });
      return;
    }

    // Check if user completed all lessons in this chapter
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

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: chapter.chapterTest.questions },
    }).select("-correctAnswer -explanation");

    // Randomize options
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

export const submitChapterTest = async (req: Request<{ id: string }, {}, SubmitTestBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // chapter ID
    const { answers } = req.body;
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

    // Get progress BEFORE allowing submission
    const progress = await getOrCreateProgress(userId, chapter.courseId.toString());

    // Check cooldown BEFORE allowing submission
    const cooldown = progress.chapterTestCooldowns.find((cd: any) => cd.chapterId.toString() === id);

    if (cooldown) {
      const cooldownHours = chapter.chapterTest.cooldownHours;
      const timeSinceLastAttempt = Date.now() - new Date(cooldown.lastAttemptAt).getTime();
      const cooldownMs = cooldownHours * 60 * 60 * 1000;

      if (timeSinceLastAttempt < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastAttempt;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        res.status(403).json({
          message: "Test is on cooldown. You cannot submit another attempt yet.",
          remainingMinutes,
          canRetakeAt: new Date(Date.now() + remainingMs),
        });
        return;
      }
    }

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: chapter.chapterTest.questions },
    });

    if (questions.length === 0) {
      res.status(400).json({ message: "No test questions found for this chapter" });
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
    const passed = score >= chapter.chapterTest.passingScore;

    // Record attempt
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
