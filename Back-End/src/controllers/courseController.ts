import { Request, Response, NextFunction } from "express";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Question from "../models/Question";
import Lesson from "../models/Lesson";

interface SubmitQuizBody {
  answers: {
    questionId: string;
    selectedAnswer: string; // Changed from number to string
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
