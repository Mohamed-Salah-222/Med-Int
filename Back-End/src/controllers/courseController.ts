import { Request, Response, NextFunction } from "express";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Question from "../models/Question";
import Lesson from "../models/Lesson";
import UserProgress from "../models/UserProgress";
import Certificate from "../models/Certificate";
import User from "../models/User";
import { generateCertificateNumber, generateVerificationCode } from "../utils/certificateGenerator";

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

interface SubmitExamBody {
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

export const getFinalExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // course ID
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const course = await Course.findById(id).populate("chapters");

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (!course.isPublished) {
      res.status(403).json({ message: "This course is not published yet" });
      return;
    }

    // Check if user passed all chapter tests
    const progress = await getOrCreateProgress(userId, id);
    const chapters = course.chapters as any[];

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

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: course.finalExam.questions as any },
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
      exam: {
        courseId: course._id,
        courseTitle: course.title,
        questions: randomizedQuestions,
        totalQuestions: randomizedQuestions.length,
        passingScore: course.finalExam.passingScore,
        timeLimit: course.finalExam.timeLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitFinalExam = async (req: Request<{ id: string }, {}, SubmitExamBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // course ID
    const { answers } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Get progress and check cooldown
    const progress = await getOrCreateProgress(userId, id);

    if (progress.finalExamCooldown?.lastAttemptAt) {
      const cooldownHours = course.finalExam.cooldownHours;
      const timeSinceLastAttempt = Date.now() - new Date(progress.finalExamCooldown.lastAttemptAt).getTime();
      const cooldownMs = cooldownHours * 60 * 60 * 1000;

      if (timeSinceLastAttempt < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastAttempt;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        res.status(403).json({
          message: "Final exam is on cooldown. You cannot submit another attempt yet.",
          remainingMinutes,
          canRetakeAt: new Date(Date.now() + remainingMs),
        });
        return;
      }
    }

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: course.finalExam.questions as any },
    });

    if (questions.length === 0) {
      res.status(400).json({ message: "No exam questions found for this course" });
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

    // If passed, mark course as completed and issue certificate
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

      // Create certificate
      const certificate = await Certificate.create({
        userId,
        courseId: id,
        userName: user.name,
        userEmail: user.email,
        courseTitle: course.title,
        completionDate: new Date(),
        certificateNumber: generateCertificateNumber(),
        verificationCode: generateVerificationCode(),
        finalExamScore: score,
        issuedAt: new Date(),
      });

      await progress.save();

      res.status(200).json({
        score,
        correctCount,
        totalQuestions,
        passed,
        passingScore: course.finalExam.passingScore,
        courseCompleted: progress.courseCompleted,
        certificateIssued: progress.certificateIssued,
        certificate: {
          certificateNumber: certificate.certificateNumber,
          verificationCode: certificate.verificationCode,
          issuedAt: certificate.issuedAt,
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
      res.status(404).json({ message: "Certificate not found. You may need to complete the course first." });
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
