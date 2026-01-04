import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Lesson from "../models/Lesson";
import Question from "../models/Question";
import User from "../models/User";
import Certificate from "../models/Certificate";
import UserProgress from "../models/UserProgress";
import Settings from "../models/Settings";

//*=====================================================
//* TYPE DEFINITIONS
//*=====================================================

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
  correctAnswer: string;
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

interface UpdateLessonBody {
  title?: string;
  lessonNumber?: number;
  content?: string;
  contentType?: "text" | "audio-exercise";
  audioUrl?: string;
  isPublished?: boolean;
  quiz?: {
    questions?: string[];
    passingScore?: number;
    unlimitedAttempts?: boolean;
  };
}

interface UpdateQuestionBody {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  type?: "quiz" | "test" | "exam";
  explanation?: string;
  audioUrl?: string;
  difficulty?: "easy" | "medium" | "hard";
}

//*=====================================================
//* COURSE MANAGEMENT
//*=====================================================

//*--- Create Course
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

//*--- Get All Courses
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

//*--- Get Single Course
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

//*--- Update Course
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

//*--- Delete Course
export const deleteCourse = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    await Course.findByIdAndDelete(id);

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* CHAPTER MANAGEMENT
//*=====================================================

//*--- Create Chapter
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

//*--- Get All Chapters
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

//*--- Get Single Chapter
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

//*--- Update Chapter
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

//*--- Delete Chapter
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

    await Chapter.findByIdAndDelete(id);

    res.status(200).json({
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* LESSON MANAGEMENT
//*=====================================================

//*--- Create Lesson
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

//*--- Get All Lessons
export const getAllLessons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chapterId } = req.query;

    const filter = chapterId ? { chapterId } : {};

    const lessons = await Lesson.find(filter).populate("chapterId", "title chapterNumber").sort({ lessonNumber: 1 });

    res.status(200).json({
      lessons: lessons.map((lesson) => ({
        id: lesson._id,
        chapterId: lesson.chapterId,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        contentType: lesson.contentType,
        quizQuestionsCount: lesson.quiz.questions.length,
        isPublished: lesson.isPublished,
        createdAt: lesson.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Single Lesson
export const getLessonById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id).populate("chapterId", "title chapterNumber");

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    res.status(200).json({
      lesson: {
        id: lesson._id,
        chapterId: lesson.chapterId,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        content: lesson.content,
        contentType: lesson.contentType,
        audioUrl: lesson.audioUrl,
        quiz: lesson.quiz,
        isPublished: lesson.isPublished,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Update Lesson
export const updateLesson = async (req: Request<{ id: string }, {}, UpdateLessonBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, lessonNumber, content, contentType, audioUrl, isPublished, quiz } = req.body;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // Update fields if provided
    if (title !== undefined) lesson.title = title;
    if (lessonNumber !== undefined) lesson.lessonNumber = lessonNumber;
    if (content !== undefined) lesson.content = content;
    if (contentType !== undefined) lesson.contentType = contentType;
    if (audioUrl !== undefined) lesson.audioUrl = audioUrl;
    if (isPublished !== undefined) lesson.isPublished = isPublished;
    if (quiz !== undefined) {
      if (quiz.questions !== undefined) lesson.quiz.questions = quiz.questions as any;
      if (quiz.passingScore !== undefined) lesson.quiz.passingScore = quiz.passingScore;
      if (quiz.unlimitedAttempts !== undefined) lesson.quiz.unlimitedAttempts = quiz.unlimitedAttempts;
    }

    await lesson.save();

    res.status(200).json({
      message: "Lesson updated successfully",
      lesson: {
        id: lesson._id,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        isPublished: lesson.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Delete Lesson
export const deleteLesson = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // Remove lesson from chapter
    await Chapter.findByIdAndUpdate(lesson.chapterId, {
      $pull: { lessons: id },
    });

    await Lesson.findByIdAndDelete(id);

    res.status(200).json({
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* QUESTION MANAGEMENT
//*=====================================================

//*--- Create Question
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
      correctAnswer,
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

//*--- Bulk Create Questions
export const bulkCreateQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ message: "Questions array is required and cannot be empty" });
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.questionText || !q.options || !q.correctAnswer || !q.type) {
        res.status(400).json({
          message: `Question at index ${i} is missing required fields (questionText, options, correctAnswer, type)`,
        });
        return;
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        res.status(400).json({
          message: `Question at index ${i} must have exactly 4 options`,
        });
        return;
      }

      if (!q.options.includes(q.correctAnswer)) {
        res.status(400).json({
          message: `Question "${q.questionText}" has invalid correct answer. It must be one of the provided options.`,
        });
        return;
      }
    }

    const createdQuestions = await Question.insertMany(questions);

    res.status(201).json({
      message: `${createdQuestions.length} questions created successfully`,
      count: createdQuestions.length,
      questionIds: createdQuestions.map((q) => q._id.toString()),
      questions: createdQuestions.map((q) => ({
        id: q._id.toString(),
        questionText: q.questionText,
        type: q.type,
      })),
    });
  } catch (error) {
    next(error);
  }
};

//*--- Assign Questions to Lesson/Chapter/Course
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

      const existingQuestionIds = lesson.quiz.questions.map((q: any) => q.toString());
      const newQuestionIds = questionIds.filter((qId) => !existingQuestionIds.includes(qId));

      lesson.quiz.questions = [...lesson.quiz.questions, ...newQuestionIds] as any;
      await lesson.save();

      res.status(200).json({
        message: "Questions assigned to lesson quiz successfully",
        assigned: newQuestionIds.length,
        total: lesson.quiz.questions.length,
      });
    } else if (targetType === "chapter") {
      const chapter = await Chapter.findById(targetId);
      if (!chapter) {
        res.status(404).json({ message: "Chapter not found" });
        return;
      }

      const existingQuestionIds = chapter.chapterTest.questions.map((q: any) => q.toString());
      const newQuestionIds = questionIds.filter((qId) => !existingQuestionIds.includes(qId));

      chapter.chapterTest.questions = [...chapter.chapterTest.questions, ...newQuestionIds] as any;
      await chapter.save();

      res.status(200).json({
        message: "Questions assigned to chapter test successfully",
        assigned: newQuestionIds.length,
        total: chapter.chapterTest.questions.length,
      });
    } else if (targetType === "course") {
      const course = await Course.findById(targetId);
      if (!course) {
        res.status(404).json({ message: "Course not found" });
        return;
      }

      const existingQuestionIds = course.finalExam.questions.map((q: any) => q.toString());
      const newQuestionIds = questionIds.filter((qId) => !existingQuestionIds.includes(qId));

      course.finalExam.questions = [...course.finalExam.questions, ...newQuestionIds] as any;
      await course.save();

      res.status(200).json({
        message: "Questions assigned to final exam successfully",
        assigned: newQuestionIds.length,
        total: course.finalExam.questions.length,
      });
    }
  } catch (error) {
    next(error);
  }
};

//*--- Get All Questions
export const getAllQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.query;

    const filter: any = {};
    if (type) {
      filter.type = type;
    }

    const questions = await Question.find(filter).sort({ createdAt: -1 });

    const questionIds = questions.map((q) => q._id);

    // Find where each question is assigned
    const [lessons, chapters, courses] = await Promise.all([
      Lesson.find({ "quiz.questions": { $in: questionIds } } as any).select("_id title lessonNumber quiz.questions"),
      Chapter.find({ "chapterTest.questions": { $in: questionIds } } as any).select("_id title chapterNumber chapterTest.questions"),
      Course.find({ "finalExam.questions": { $in: questionIds } } as any).select("_id title finalExam.questions"),
    ]);

    res.status(200).json({
      total: questions.length,
      questions: questions.map((q) => {
        let assignedTo = null;

        const assignedLesson = lessons.find((l) => l.quiz.questions.some((qId: any) => qId.toString() === q._id.toString()));
        if (assignedLesson) {
          assignedTo = {
            type: "lesson",
            id: assignedLesson._id,
            title: `Lesson ${assignedLesson.lessonNumber}: ${assignedLesson.title}`,
          };
        }

        if (!assignedTo) {
          const assignedChapter = chapters.find((c) => c.chapterTest.questions.some((qId: any) => qId.toString() === q._id.toString()));
          if (assignedChapter) {
            assignedTo = {
              type: "chapter",
              id: assignedChapter._id,
              title: `Chapter ${assignedChapter.chapterNumber}: ${assignedChapter.title}`,
            };
          }
        }

        if (!assignedTo) {
          const assignedCourse = courses.find((c) => c.finalExam.questions.some((qId: any) => qId.toString() === q._id.toString()));
          if (assignedCourse) {
            assignedTo = {
              type: "course",
              id: assignedCourse._id,
              title: assignedCourse.title,
            };
          }
        }

        return {
          id: q._id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          type: q.type,
          hasExplanation: !!q.explanation,
          hasAudio: !!q.audioUrl,
          createdAt: q.createdAt,
          assignedTo,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Single Question
export const getQuestionById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    res.status(200).json({
      question: {
        id: question._id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        type: question.type,
        explanation: question.explanation,
        audioUrl: question.audioUrl,
        difficulty: question.difficulty,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Update Question
export const updateQuestion = async (req: Request<{ id: string }, {}, UpdateQuestionBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { questionText, options, correctAnswer, type, explanation, audioUrl, difficulty } = req.body;

    const question = await Question.findById(id);

    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    // Update fields if provided
    if (questionText !== undefined) question.questionText = questionText;
    if (options !== undefined) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (type !== undefined) question.type = type;
    if (explanation !== undefined) question.explanation = explanation;
    if (audioUrl !== undefined) question.audioUrl = audioUrl;
    if (difficulty !== undefined) question.difficulty = difficulty;

    await question.save();

    res.status(200).json({
      message: "Question updated successfully",
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

//*--- Delete Question
export const deleteQuestion = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    await Question.findByIdAndDelete(id);

    res.status(200).json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* USER MANAGEMENT
//*=====================================================

//*--- Get All Users (with Pagination)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    }

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select("name email role isVerified createdAt").sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    const total = await User.countDocuments(filter);

    const usersData = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    }));

    res.status(200).json({
      users: usersData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Single User with Progress
export const getUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const progress = await UserProgress.findOne({
      userId: id,
      courseId: process.env.COURSE_ID,
    })
      .populate("completedLessons.lessonId", "title lessonNumber")
      .populate("chapterTestAttempts.chapterId", "title chapterNumber");

    let completionPercentage = 0;
    if (progress) {
      const course = await Course.findById(process.env.COURSE_ID);
      if (course && course.chapters && course.chapters.length > 0) {
        const chapterIds = course.chapters.map((id) => id.toString());
        const totalLessons = await Lesson.countDocuments({
          chapterId: { $in: chapterIds as any },
        });
        if (totalLessons > 0) {
          completionPercentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
        }
      }
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      progress: progress
        ? {
            currentChapter: progress.currentChapterNumber,
            currentLesson: progress.currentLessonNumber,
            completionPercentage,
            courseCompleted: progress.courseCompleted,
            completedAt: progress.completedAt,
            certificateIssued: progress.certificateIssued,
            certificateIssuedAt: progress.certificateIssuedAt,
            completedLessons: progress.completedLessons,
            chapterTestAttempts: progress.chapterTestAttempts,
            chapterTestCooldowns: progress.chapterTestCooldowns,
            finalExamAttempts: progress.finalExamAttempts,
            finalExamCooldown: progress.finalExamCooldown,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

//*--- Update User Role
export const updateUserRole = async (req: Request<{ id: string }, {}, { role: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["Student", "Admin", "SuperVisor"].includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.role = role as any;
    await user.save();

    res.status(200).json({
      message: "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Reset Test Cooldown
export const resetTestCooldown = async (req: Request<{ id: string }, {}, { chapterId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { chapterId } = req.body;

    const progress = await UserProgress.findOne({
      userId: id,
      courseId: process.env.COURSE_ID,
    });

    if (!progress) {
      res.status(404).json({ message: "User progress not found" });
      return;
    }

    progress.chapterTestCooldowns = progress.chapterTestCooldowns.filter((cooldown) => cooldown.chapterId.toString() !== chapterId);

    await progress.save();

    res.status(200).json({
      message: "Test cooldown reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Reset Exam Cooldown
export const resetExamCooldown = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const progress = await UserProgress.findOne({
      userId: id,
      courseId: process.env.COURSE_ID,
    });

    if (!progress) {
      res.status(404).json({ message: "User progress not found" });
      return;
    }

    progress.finalExamCooldown = undefined;
    await progress.save();

    res.status(200).json({
      message: "Exam cooldown reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Delete User
export const deleteUser = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await UserProgress.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Reset User Progress
export const resetUserProgress = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const progress = await UserProgress.findOne({
      userId: id,
      courseId: process.env.COURSE_ID,
    });

    if (!progress) {
      res.status(404).json({ message: "User progress not found" });
      return;
    }

    progress.currentChapterNumber = 1;
    progress.currentLessonNumber = 1;
    progress.completedLessons = [];
    progress.chapterTestAttempts = [];
    progress.chapterTestCooldowns = [];
    progress.finalExamAttempts = [];
    progress.finalExamCooldown = undefined;
    progress.courseCompleted = false;
    progress.completedAt = undefined;
    progress.certificateIssued = false;
    progress.certificateIssuedAt = undefined;

    await progress.save();

    res.status(200).json({
      message: "User progress reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get User Progress (Detailed)
export const getUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, courseId } = req.params;

    const progress = await UserProgress.findOne({ userId, courseId });
    const course = await Course.findById(courseId).populate({
      path: "chapters",
      options: { sort: { chapterNumber: 1 } },
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const chapters = await Chapter.find({ courseId }).sort({ chapterNumber: 1 });

    const detailedChapters = await Promise.all(
      chapters.map(async (chapter) => {
        const lessons = await Lesson.find({ chapterId: chapter._id }).sort({ lessonNumber: 1 });

        const lessonProgress = lessons.map((lesson) => {
          const completed = progress?.completedLessons.find((cl) => cl.lessonId.toString() === lesson._id.toString());

          return {
            lessonId: lesson._id.toString(),
            lessonNumber: lesson.lessonNumber,
            title: lesson.title,
            completed: !!completed,
            quizScore: completed?.quizScore || 0,
            attempts: completed?.attempts || 0,
            completedAt: completed?.completedAt?.toISOString() || null,
          };
        });

        const allLessonsCompleted = lessons.length > 0 && lessonProgress.every((l) => l.completed);

        const testAttempts = progress?.chapterTestAttempts.filter((attempt) => attempt.chapterId.toString() === chapter._id.toString());
        const passedAttempt = testAttempts?.find((attempt) => attempt.passed);

        return {
          chapterId: chapter._id.toString(),
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          totalLessons: lessons.length,
          completedLessons: lessonProgress.filter((l) => l.completed).length,
          allLessonsCompleted,
          testTaken: (testAttempts?.length || 0) > 0,
          testPassed: !!passedAttempt,
          testScore: passedAttempt?.score || null,
          testAttemptedAt: passedAttempt?.attemptedAt?.toISOString() || null,
          lessons: lessonProgress,
        };
      })
    );

    let currentChapter = 1;
    let currentLesson = 1;

    if (progress) {
      currentChapter = progress.currentChapterNumber || 1;
      currentLesson = progress.currentLessonNumber || 1;
    }

    let nextAction = null;

    if (progress?.courseCompleted) {
      nextAction = {
        type: "completed",
        message: "Course completed! View your certificates.",
      };
    } else {
      const incompleteChapter = detailedChapters.find((ch) => !ch.testPassed);

      if (incompleteChapter) {
        const incompleteLesson = incompleteChapter.lessons.find((l) => !l.completed);

        if (incompleteLesson) {
          nextAction = {
            type: "lesson",
            chapterNumber: incompleteChapter.chapterNumber,
            lessonNumber: incompleteLesson.lessonNumber,
            title: incompleteLesson.title,
            message: `Continue with Chapter ${incompleteChapter.chapterNumber}, Lesson ${incompleteLesson.lessonNumber}: ${incompleteLesson.title}`,
          };
        } else if (incompleteChapter.allLessonsCompleted && !incompleteChapter.testPassed) {
          nextAction = {
            type: "chapter-test",
            chapterNumber: incompleteChapter.chapterNumber,
            message: `Take the test for Chapter ${incompleteChapter.chapterNumber}: ${incompleteChapter.title}`,
          };
        }
      } else if (detailedChapters.every((ch) => ch.testPassed)) {
        nextAction = {
          type: "final-exam",
          message: "You've completed all chapters! Take the final exam to earn your certificates.",
        };
      }
    }

    const finalExamAttempts = progress?.finalExamAttempts || [];
    const passedExam = finalExamAttempts.find((attempt) => attempt.passed);
    const bestScore = finalExamAttempts.length > 0 ? Math.max(...finalExamAttempts.map((a) => a.score)) : 0;

    const detailedProgress = {
      currentChapter,
      currentLesson,
      courseCompleted: progress?.courseCompleted || false,
      certificateIssued: progress?.certificateIssued || false,
      completedAt: progress?.completedAt?.toISOString() || null,
      chapters: detailedChapters,
      finalExam: {
        attempts: finalExamAttempts.map((attempt) => ({
          attemptedAt: attempt.attemptedAt.toISOString(),
          score: attempt.score,
          passed: attempt.passed,
        })),
        passed: !!passedExam,
        bestScore,
      },
      nextAction,
    };

    res.status(200).json({ progress: detailedProgress });
  } catch (error) {
    next(error);
  }
};

//*--- Get All Users Progress
export const getAllUsersProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      res.status(400).json({ message: "Course ID is required" });
      return;
    }

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

//*=====================================================
//* STATISTICS & ANALYTICS
//*=====================================================

//*--- Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const studentUsers = await User.countDocuments({ role: "Student" });
    const usersWithProgress = await UserProgress.countDocuments();
    const completedUsers = await UserProgress.countDocuments({
      courseCompleted: true,
    });
    const certificatesIssued = await Certificate.countDocuments();

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

//*--- Detailed Statistics
export const getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalQuestions = await Question.countDocuments();

    const quizQuestions = await Question.countDocuments({ type: "quiz" });
    const testQuestions = await Question.countDocuments({ type: "test" });
    const examQuestions = await Question.countDocuments({ type: "exam" });

    const allProgress = await UserProgress.find();

    let totalQuizAttempts = 0;
    let passedQuizzes = 0;
    let totalQuizScore = 0;
    let quizCount = 0;

    allProgress.forEach((progress) => {
      progress.completedLessons.forEach((lesson) => {
        totalQuizAttempts += lesson.attempts || 0;
        if (lesson.passed) passedQuizzes++;
        if (lesson.quizScore) {
          totalQuizScore += lesson.quizScore;
          quizCount++;
        }
      });
    });

    let totalTestAttempts = 0;
    let passedTests = 0;
    let totalTestScore = 0;

    allProgress.forEach((progress) => {
      totalTestAttempts += progress.chapterTestAttempts.length;
      progress.chapterTestAttempts.forEach((test) => {
        if (test.passed) passedTests++;
        if (test.score) totalTestScore += test.score;
      });
    });

    let totalExamAttempts = 0;
    let passedExams = 0;
    let totalExamScore = 0;

    allProgress.forEach((progress) => {
      totalExamAttempts += progress.finalExamAttempts.length;
      progress.finalExamAttempts.forEach((exam) => {
        if (exam.passed) passedExams++;
        if (exam.score) totalExamScore += exam.score;
      });
    });

    const completedCourses = await UserProgress.countDocuments({ courseCompleted: true });
    const certificatesIssued = await UserProgress.countDocuments({ certificateIssued: true });

    const avgQuizScore = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0;
    const avgTestScore = totalTestAttempts > 0 ? Math.round(totalTestScore / totalTestAttempts) : 0;
    const avgExamScore = totalExamAttempts > 0 ? Math.round(totalExamScore / totalExamAttempts) : 0;

    const quizPassRate = totalQuizAttempts > 0 ? Math.round((passedQuizzes / totalQuizAttempts) * 100) : 0;
    const testPassRate = totalTestAttempts > 0 ? Math.round((passedTests / totalTestAttempts) * 100) : 0;
    const examPassRate = totalExamAttempts > 0 ? Math.round((passedExams / totalExamAttempts) * 100) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    let recentQuizAttempts = 0;
    let recentTestAttempts = 0;
    let recentExamAttempts = 0;

    allProgress.forEach((progress) => {
      progress.completedLessons.forEach((lesson) => {
        if (lesson.completedAt && lesson.completedAt >= thirtyDaysAgo) {
          recentQuizAttempts++;
        }
      });
      progress.chapterTestAttempts.forEach((test) => {
        if (test.attemptedAt && test.attemptedAt >= thirtyDaysAgo) {
          recentTestAttempts++;
        }
      });
      progress.finalExamAttempts.forEach((exam) => {
        if (exam.attemptedAt && exam.attemptedAt >= thirtyDaysAgo) {
          recentExamAttempts++;
        }
      });
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    const dailyActivity = last7Days.map((date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      let quizzes = 0;
      let tests = 0;
      let exams = 0;

      allProgress.forEach((progress) => {
        progress.completedLessons.forEach((lesson) => {
          if (lesson.completedAt && lesson.completedAt >= date && lesson.completedAt < nextDate) {
            quizzes++;
          }
        });
        progress.chapterTestAttempts.forEach((test) => {
          if (test.attemptedAt && test.attemptedAt >= date && test.attemptedAt < nextDate) {
            tests++;
          }
        });
        progress.finalExamAttempts.forEach((exam) => {
          if (exam.attemptedAt && exam.attemptedAt >= date && exam.attemptedAt < nextDate) {
            exams++;
          }
        });
      });

      return {
        date: date.toISOString().split("T")[0],
        quizzes,
        tests,
        exams,
      };
    });

    res.status(200).json({
      overview: {
        totalUsers,
        totalCourses,
        totalChapters,
        totalLessons,
        totalQuestions,
        completedCourses,
        certificatesIssued,
      },
      questions: {
        total: totalQuestions,
        quiz: quizQuestions,
        test: testQuestions,
        exam: examQuestions,
      },
      attempts: {
        quizzes: {
          total: totalQuizAttempts,
          passed: passedQuizzes,
          avgScore: avgQuizScore,
          passRate: quizPassRate,
        },
        tests: {
          total: totalTestAttempts,
          passed: passedTests,
          avgScore: avgTestScore,
          passRate: testPassRate,
        },
        exams: {
          total: totalExamAttempts,
          passed: passedExams,
          avgScore: avgExamScore,
          passRate: examPassRate,
        },
      },
      recentActivity: {
        newUsers: recentUsers,
        quizAttempts: recentQuizAttempts,
        testAttempts: recentTestAttempts,
        examAttempts: recentExamAttempts,
      },
      dailyActivity,
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get All Certificates
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

//*=====================================================
//* SETTINGS MANAGEMENT
//*=====================================================

//*--- Get Settings
export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      const newSettings = await Settings.create({});
      settings = Array.isArray(newSettings) ? newSettings[0] : newSettings;
    }

    if (!settings) {
      res.status(500).json({ message: "Failed to create settings" });
      return;
    }

    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalCertificates = await Certificate.countDocuments();

    res.status(200).json({
      settings: {
        id: settings._id,
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        timezone: settings.timezone,
        maintenanceMode: settings.maintenanceMode,
        defaultQuizPassingScore: settings.defaultQuizPassingScore,
        defaultTestPassingScore: settings.defaultTestPassingScore,
        defaultExamPassingScore: settings.defaultExamPassingScore,
        defaultTestCooldownHours: settings.defaultTestCooldownHours,
        defaultExamCooldownHours: settings.defaultExamCooldownHours,
        unlimitedQuizRetries: settings.unlimitedQuizRetries,
        smtpConfigured: settings.smtpConfigured,
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        certificatePrefix: settings.certificatePrefix,
        autoIssueCertificates: settings.autoIssueCertificates,
        certificateTemplate: settings.certificateTemplate,
        lastBackupDate: settings.lastBackupDate || null,
        updatedAt: settings.updatedAt,
      },
      systemStats: {
        totalUsers,
        totalCourses,
        totalQuestions,
        totalCertificates,
        apiVersion: "1.0.0",
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Update Settings
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      const newSettings = await Settings.create(updates);
      settings = Array.isArray(newSettings) ? newSettings[0] : newSettings;
    } else {
      const allowedFields = ["platformName", "supportEmail", "timezone", "maintenanceMode", "defaultQuizPassingScore", "defaultTestPassingScore", "defaultExamPassingScore", "defaultTestCooldownHours", "defaultExamCooldownHours", "unlimitedQuizRetries", "smtpConfigured", "emailNotificationsEnabled", "certificatePrefix", "autoIssueCertificates", "certificateTemplate"];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (settings as any)[field] = updates[field];
        }
      });

      await settings.save();
    }

    if (!settings) {
      res.status(500).json({ message: "Failed to save settings" });
      return;
    }

    res.status(200).json({
      message: "Settings updated successfully",
      settings: {
        id: settings._id,
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        timezone: settings.timezone,
        maintenanceMode: settings.maintenanceMode,
        defaultQuizPassingScore: settings.defaultQuizPassingScore,
        defaultTestPassingScore: settings.defaultTestPassingScore,
        defaultExamPassingScore: settings.defaultExamPassingScore,
        defaultTestCooldownHours: settings.defaultTestCooldownHours,
        defaultExamCooldownHours: settings.defaultExamCooldownHours,
        unlimitedQuizRetries: settings.unlimitedQuizRetries,
        smtpConfigured: settings.smtpConfigured,
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        certificatePrefix: settings.certificatePrefix,
        autoIssueCertificates: settings.autoIssueCertificates,
        certificateTemplate: settings.certificateTemplate,
        lastBackupDate: settings.lastBackupDate || null,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Test Email
export const testEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement actual email sending
    res.status(200).json({
      message: "Test email sent successfully (simulated)",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* EXPORTS
//*=====================================================

export // Course Management
// Chapter Management
// Lesson Management
// Question Management
// User Management
// Statistics & Analytics
// Settings Management
 {};
