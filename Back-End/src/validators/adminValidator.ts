import { body } from "express-validator";

export const createCourseValidator = [body("title").trim().notEmpty().withMessage("Course title is required").isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"), body("description").trim().notEmpty().withMessage("Course description is required").isLength({ min: 10, max: 1000 }).withMessage("Description must be between 10 and 1000 characters")];

export const createChapterValidator = [
  body("courseId").trim().notEmpty().withMessage("Course ID is required").isMongoId().withMessage("Invalid course ID format"),

  body("title").trim().notEmpty().withMessage("Chapter title is required").isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),

  body("description").trim().notEmpty().withMessage("Chapter description is required").isLength({ min: 10, max: 1000 }).withMessage("Description must be between 10 and 1000 characters"),

  body("chapterNumber").isInt({ min: 1 }).withMessage("Chapter number must be a positive integer"),
];

export const createLessonValidator = [
  body("chapterId").trim().notEmpty().withMessage("Chapter ID is required").isMongoId().withMessage("Invalid chapter ID format"),

  body("title").trim().notEmpty().withMessage("Lesson title is required").isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),

  body("lessonNumber").isInt({ min: 1 }).withMessage("Lesson number must be a positive integer"),

  body("content").trim().notEmpty().withMessage("Lesson content is required").isLength({ min: 50 }).withMessage("Content must be at least 50 characters"),

  body("contentType").isIn(["text", "audio-exercise"]).withMessage("Content type must be either 'text' or 'audio-exercise'"),

  body("audioUrl").optional().trim().isURL().withMessage("Audio URL must be a valid URL"),
];

export const createQuestionValidator = [
  body("questionText").trim().notEmpty().withMessage("Question text is required").isLength({ min: 10, max: 1000 }).withMessage("Question text must be between 10 and 1000 characters"),

  body("options").isArray({ min: 4, max: 4 }).withMessage("Must provide exactly 4 options"),

  body("options.*").trim().notEmpty().withMessage("All options must have text"),

  body("correctAnswer").trim().notEmpty().withMessage("Correct answer is required"), // Changed validation

  body("type").isIn(["quiz", "test", "exam"]).withMessage("Type must be 'quiz', 'test', or 'exam'"),

  body("explanation").optional().trim().isLength({ max: 500 }).withMessage("Explanation must be less than 500 characters"),

  body("audioUrl").optional().trim().isURL().withMessage("Audio URL must be valid"),

  body("difficulty").optional().isIn(["easy", "medium", "hard"]).withMessage("Difficulty must be 'easy', 'medium', or 'hard'"),
];

export const assignQuestionsValidator = [
  body("targetId").trim().notEmpty().withMessage("Target ID is required (lesson or chapter)").isMongoId().withMessage("Invalid target ID format"),

  body("targetType").isIn(["lesson", "chapter", "course"]).withMessage("Target type must be 'lesson', 'chapter', or 'course'"),

  body("questionIds").isArray({ min: 1 }).withMessage("Must provide at least one question ID"),

  body("questionIds.*").isMongoId().withMessage("All question IDs must be valid"),
];

export const linkChapterValidator = [body("courseId").trim().notEmpty().withMessage("Course ID is required").isMongoId().withMessage("Invalid course ID"), body("chapterId").trim().notEmpty().withMessage("Chapter ID is required").isMongoId().withMessage("Invalid chapter ID")];
