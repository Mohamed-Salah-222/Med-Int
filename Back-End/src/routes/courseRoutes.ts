import express from "express";
import { getCourse, getChapter, getLesson, getLessonQuiz, submitLessonQuiz, getUserProgress, getChapterTest, submitChapterTest, getFinalExam, submitFinalExam, getUserCertificate, verifyCertificate } from "../controllers/courseController";
import { submitQuizValidator, submitTestValidator, submitExamValidator } from "../validators/courseValidator";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// PUBLIC route (no auth) - must be BEFORE authMiddleware
router.get("/verify-certificate", verifyCertificate);

// All other routes require authentication
router.use(authMiddleware);

// Course routes
router.get("/:id", getCourse);
router.get("/:id/exam", getFinalExam);
router.post("/:id/submit-exam", submitExamValidator, submitFinalExam);
router.get("/:courseId/progress", getUserProgress);
router.get("/:courseId/certificate", getUserCertificate);

// Chapter routes
router.get("/chapters/:id", getChapter);
router.get("/chapters/:id/test", getChapterTest);
router.post("/chapters/:id/submit-test", submitTestValidator, submitChapterTest);

// Lesson routes
router.get("/lessons/:id", getLesson);
router.get("/lessons/:id/quiz", getLessonQuiz);
router.post("/lessons/:id/submit-quiz", submitQuizValidator, submitLessonQuiz);

export default router;
