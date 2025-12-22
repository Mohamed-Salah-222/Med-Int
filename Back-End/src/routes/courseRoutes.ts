import express from "express";
import { getCourse, getChapter, getLesson, getLessonQuiz, submitLessonQuiz, getUserProgress } from "../controllers/courseController";
import authMiddleware from "../middleware/authMiddleware";
import { submitQuizValidator } from "../validators/courseValidator";
import { validationResult } from "express-validator";

const router = express.Router();

router.use(authMiddleware);

router.get("/:id", getCourse);
router.get("/chapters/:id", getChapter);
router.get("/lessons/:id", getLesson);
router.get("/lessons/:id/quiz", getLessonQuiz);
router.post("/lessons/:id/submit-quiz", submitQuizValidator, submitLessonQuiz);
router.get("/:courseId/progress", getUserProgress);

export default router;
