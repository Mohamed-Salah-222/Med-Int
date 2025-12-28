import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Lesson from "../models/Lesson";
import Question from "../models/Question";
import User from "../models/User";
import Certificate from "../models/Certificate";
import UserProgress from "../models/UserProgress";

interface CreateCourseBody {
  title: string;
  description: string;
}

interface CreateChapterBody {
  courseId: string;
  title: string;
  description: string;
  chapterNumber: number;
}

interface CreateLessonBody {
  chapterId: string;
  title: string;
  lessonNumber: number;
  content: string;
  contentType: "text" | "audio-exercise";
  audioUrl?: string;
}

interface CreateQuestionBody {
  questionText: string;
  options: string[];
  correctAnswer: string; // Changed to string
  type: "quiz" | "test" | "exam";
  explanation?: string;
  audioUrl?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface AssignQuestionsBody {
  targetId: string;
  targetType: "lesson" | "chapter" | "course";
  questionIds: string[];
}

interface UpdateCourseBody {
  title?: string;
  description?: string;
  totalChapters?: number;
  isPublished?: boolean;
  finalExam?: {
    questions?: string[];
    passingScore?: number;
    cooldownHours?: number;
    timeLimit?: number;
  };
}

interface UpdateChapterBody {
  title?: string;
  description?: string;
  chapterNumber?: number;
  isPublished?: boolean;
  chapterTest?: {
    questions?: string[];
    passingScore?: number;
    cooldownHours?: number;
    timeLimit?: number;
  };
}

export const createCourse = async (req: Request<{}, {}, CreateCourseBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { title, description } = req.body;

    const course = await Course.create({
      title,
      description,
      totalChapters: 0,
      chapters: [],
      finalExam: {
        questions: [],
        passingScore: 80,
        cooldownHours: 24,
        timeLimit: 100,
      },
      isPublished: false,
    });

    res.status(201).json({
      message: "Course created successfully",
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req: Request<{}, {}, CreateChapterBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { courseId, title, description, chapterNumber } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const chapter = await Chapter.create({
      courseId,
      title,
      description,
      chapterNumber,
      lessons: [],
      chapterTest: {
        questions: [],
        passingScore: 70,
        cooldownHours: 3,
        timeLimit: 20,
      },
      isPublished: false,
    });

    course.chapters.push(chapter._id as any);
    course.totalChapters = course.chapters.length;
    await course.save();

    res.status(201).json({
      message: "Chapter created successfully",
      chapter: {
        id: chapter._id,
        title: chapter.title,
        description: chapter.description,
        chapterNumber: chapter.chapterNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (req: Request<{}, {}, CreateLessonBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { chapterId, title, lessonNumber, content, contentType, audioUrl } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    const lesson = await Lesson.create({
      chapterId,
      title,
      lessonNumber,
      content,
      contentType,
      audioUrl,
      quiz: {
        questions: [],
        passingScore: 80,
        unlimitedAttempts: true,
      },
      isPublished: false,
    });

    chapter.lessons.push(lesson._id as any);
    await chapter.save();

    res.status(201).json({
      message: "Lesson created successfully",
      lesson: {
        id: lesson._id,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        contentType: lesson.contentType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: Request<{}, {}, CreateQuestionBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { questionText, options, correctAnswer, type, explanation, audioUrl, difficulty } = req.body;

    // Validate that correctAnswer is one of the options
    if (!options.includes(correctAnswer)) {
      res.status(400).json({ message: "Correct answer must be one of the provided options" });
      return;
    }

    const question = await Question.create({
      questionText,
      options,
      correctAnswer, // Now stores the actual text
      type,
      explanation,
      audioUrl,
      difficulty,
    });

    res.status(201).json({
      message: "Question created successfully",
      question: {
        id: question._id,
        questionText: question.questionText,
        type: question.type,
        difficulty: question.difficulty,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const assignQuestions = async (req: Request<{}, {}, AssignQuestionsBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { targetId, targetType, questionIds } = req.body;

    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      res.status(404).json({ message: "Some question IDs are invalid" });
      return;
    }

    if (targetType === "lesson") {
      const lesson = await Lesson.findById(targetId);
      if (!lesson) {
        res.status(404).json({ message: "Lesson not found" });
        return;
      }

      lesson.quiz.questions = questionIds as any;
      await lesson.save();

      res.status(200).json({
        message: "Questions assigned to lesson quiz successfully",
        assigned: questionIds.length,
      });
    } else if (targetType === "chapter") {
      const chapter = await Chapter.findById(targetId);
      if (!chapter) {
        res.status(404).json({ message: "Chapter not found" });
        return;
      }

      chapter.chapterTest.questions = questionIds as any;
      await chapter.save();

      res.status(200).json({
        message: "Questions assigned to chapter test successfully",
        assigned: questionIds.length,
      });
    } else if (targetType === "course") {
      const course = await Course.findById(targetId);
      if (!course) {
        res.status(404).json({ message: "Course not found" });
        return;
      }

      course.finalExam.questions = questionIds as any;
      await course.save();

      res.status(200).json({
        message: "Questions assigned to final exam successfully",
        assigned: questionIds.length,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Users with Student role
    const studentUsers = await User.countDocuments({ role: "Student" });

    // Users who started the course (have progress)
    const usersWithProgress = await UserProgress.countDocuments();

    // Users who completed the course
    const completedUsers = await UserProgress.countDocuments({
      courseCompleted: true,
    });

    // Total certificates issued
    const certificatesIssued = await Certificate.countDocuments();

    // Course completion rate
    const completionRate = usersWithProgress > 0 ? Math.round((completedUsers / usersWithProgress) * 100) : 0;

    res.status(200).json({
      stats: {
        totalUsers,
        studentUsers,
        usersWithProgress,
        completedUsers,
        certificatesIssued,
        completionRate: `${completionRate}%`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certificates = await Certificate.find().sort({ issuedAt: -1 }).select("certificateNumber userName userEmail courseTitle finalExamScore completionDate issuedAt");

    res.status(200).json({
      total: certificates.length,
      certificates,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      res.status(400).json({ message: "Course ID is required" });
      return;
    }

    // Get all progress for this course
    const progressRecords = await UserProgress.find({ courseId }).populate("userId", "name email createdAt").sort({ updatedAt: -1 });

    const usersProgress = progressRecords.map((progress: any) => ({
      userId: progress.userId._id,
      userName: progress.userId.name,
      userEmail: progress.userId.email,
      userRegisteredAt: progress.userId.createdAt,
      completedLessons: progress.completedLessons.length,
      chapterTestsPassed: progress.chapterTestAttempts.filter((attempt: any) => attempt.passed).length,
      finalExamAttempts: progress.finalExamAttempts.length,
      finalExamPassed: progress.finalExamAttempts.some((attempt: any) => attempt.passed),
      courseCompleted: progress.courseCompleted,
      certificateIssued: progress.certificateIssued,
      completedAt: progress.completedAt,
      lastActivity: progress.updatedAt,
    }));

    res.status(200).json({
      total: usersProgress.length,
      users: usersProgress,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courses = await Course.find().populate("chapters", "title chapterNumber").sort({ createdAt: -1 });

    res.status(200).json({
      courses: courses.map((course) => ({
        id: course._id,
        title: course.title,
        description: course.description,
        totalChapters: course.totalChapters,
        chaptersCount: course.chapters.length,
        isPublished: course.isPublished,
        finalExamQuestionsCount: course.finalExam.questions.length,
        createdAt: course.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET single course
export const getCourseById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate("chapters", "title chapterNumber description");

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json({
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        totalChapters: course.totalChapters,
        chapters: course.chapters,
        finalExam: course.finalExam,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE course
export const updateCourse = async (req: Request<{ id: string }, {}, UpdateCourseBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, totalChapters, isPublished, finalExam } = req.body;

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Update fields if provided
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (totalChapters !== undefined) course.totalChapters = totalChapters;
    if (isPublished !== undefined) course.isPublished = isPublished;
    if (finalExam !== undefined) {
      if (finalExam.questions !== undefined) course.finalExam.questions = finalExam.questions as any;
      if (finalExam.passingScore !== undefined) course.finalExam.passingScore = finalExam.passingScore;
      if (finalExam.cooldownHours !== undefined) course.finalExam.cooldownHours = finalExam.cooldownHours;
      if (finalExam.timeLimit !== undefined) course.finalExam.timeLimit = finalExam.timeLimit;
    }

    await course.save();

    res.status(200).json({
      message: "Course updated successfully",
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        totalChapters: course.totalChapters,
        isPublished: course.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE course
export const deleteCourse = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Optional: Delete all related chapters, lessons, and user progress
    // await Chapter.deleteMany({ courseId: id });
    // await Lesson.deleteMany({ chapterId: { $in: course.chapters } });
    // await UserProgress.deleteMany({ courseId: id });

    await Course.findByIdAndDelete(id);

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// GET all chapters
export const getAllChapters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.query;

    const filter = courseId ? { courseId } : {};

    const chapters = await Chapter.find(filter).populate("courseId", "title").populate("lessons", "title lessonNumber").sort({ chapterNumber: 1 });

    res.status(200).json({
      chapters: chapters.map((chapter) => ({
        id: chapter._id,
        courseId: chapter.courseId,
        title: chapter.title,
        description: chapter.description,
        chapterNumber: chapter.chapterNumber,
        lessonsCount: chapter.lessons.length,
        testQuestionsCount: chapter.chapterTest.questions.length,
        isPublished: chapter.isPublished,
        createdAt: chapter.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET single chapter
export const getChapterById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id).populate("courseId", "title").populate("lessons", "title lessonNumber");

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    res.status(200).json({
      chapter: {
        id: chapter._id,
        courseId: chapter.courseId,
        title: chapter.title,
        description: chapter.description,
        chapterNumber: chapter.chapterNumber,
        lessons: chapter.lessons,
        chapterTest: chapter.chapterTest,
        isPublished: chapter.isPublished,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE chapter
export const updateChapter = async (req: Request<{ id: string }, {}, UpdateChapterBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, chapterNumber, isPublished, chapterTest } = req.body;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Update fields if provided
    if (title !== undefined) chapter.title = title;
    if (description !== undefined) chapter.description = description;
    if (chapterNumber !== undefined) chapter.chapterNumber = chapterNumber;
    if (isPublished !== undefined) chapter.isPublished = isPublished;
    if (chapterTest !== undefined) {
      if (chapterTest.questions !== undefined) chapter.chapterTest.questions = chapterTest.questions as any;
      if (chapterTest.passingScore !== undefined) chapter.chapterTest.passingScore = chapterTest.passingScore;
      if (chapterTest.cooldownHours !== undefined) chapter.chapterTest.cooldownHours = chapterTest.cooldownHours;
      if (chapterTest.timeLimit !== undefined) chapter.chapterTest.timeLimit = chapterTest.timeLimit;
    }

    await chapter.save();

    res.status(200).json({
      message: "Chapter updated successfully",
      chapter: {
        id: chapter._id,
        title: chapter.title,
        description: chapter.description,
        chapterNumber: chapter.chapterNumber,
        isPublished: chapter.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE chapter
export const deleteChapter = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Remove chapter from course
    await Course.findByIdAndUpdate(chapter.courseId, {
      $pull: { chapters: id },
    });

    // Update totalChapters count
    const course = await Course.findById(chapter.courseId);
    if (course) {
      course.totalChapters = course.chapters.length;
      await course.save();
    }

    // Optional: Delete all related lessons
    // await Lesson.deleteMany({ chapterId: id });

    await Chapter.findByIdAndDelete(id);

    res.status(200).json({
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
