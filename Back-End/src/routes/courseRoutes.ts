import express from "express";
import { getCourse, getChapter, getLesson, getLessonQuiz, submitLessonQuiz, getUserProgress, submitChapterTest, getChapterTest, getFinalExam, submitFinalExam } from "../controllers/courseController";
import authMiddleware from "../middleware/authMiddleware";
import { submitQuizValidator, submitTestValidator, submitExamValidator } from "../validators/courseValidator";
import { validationResult } from "express-validator";

const router = express.Router();

router.use(authMiddleware);

router.get("/:id", getCourse);
router.get("/:id/exam", getFinalExam);
router.post("/:id/submit-exam", submitExamValidator, submitFinalExam);
router.get("/chapters/:id", getChapter);
router.get("/chapters/:id/test", getChapterTest);
router.post("/chapters/:id/submit-test", submitTestValidator, submitChapterTest);
router.get("/lessons/:id", getLesson);
router.get("/lessons/:id/quiz", getLessonQuiz);
router.post("/lessons/:id/submit-quiz", submitQuizValidator, submitLessonQuiz);
router.get("/:courseId/progress", getUserProgress);

export default router;
