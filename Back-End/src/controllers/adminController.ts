import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Lesson from "../models/Lesson";
import Question from "../models/Question";

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
