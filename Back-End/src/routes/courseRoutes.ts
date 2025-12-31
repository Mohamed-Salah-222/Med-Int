import express from "express";
import { getCourse, getChapter, getLesson, getLessonQuiz, submitLessonQuiz, getUserProgress, getChapterTest, submitChapterTest, getFinalExam, submitFinalExam, getDetailedProgress, getUserCertificate, verifyCertificate, getUserCertificates, startChapterTest, abandonChapterTest } from "../controllers/courseController";
import { submitQuizValidator, submitTestValidator, submitExamValidator } from "../validators/courseValidator";
import authMiddleware from "../middleware/authMiddleware";
import { requireStudent } from "../middleware/roleMiddleware";

const router = express.Router();

// PUBLIC route (no auth) - must be BEFORE authMiddleware
router.get("/verify-certificate", verifyCertificate);

// All other routes require authentication AND Student role
router.use(authMiddleware);
router.use(requireStudent); // Add this single line to protect all routes below

// Course routes
router.get("/:id", getCourse);
router.get("/:id/exam", getFinalExam);
router.post("/:id/submit-exam", submitExamValidator, submitFinalExam);
router.get("/:courseId/progress", getUserProgress);
router.get("/:courseId/detailed-progress", getDetailedProgress);
router.get("/:courseId/certificate", getUserCertificate);
router.get("/:courseId/certificates", getUserCertificates);

// Chapter routes
router.get("/chapters/:id", getChapter);
router.get("/chapters/:id/test", getChapterTest);
router.post("/chapters/:id/test/start", startChapterTest);
router.post("/chapters/:id/test/submit", submitChapterTest);
router.post("/chapters/:id/test/abandon", abandonChapterTest);

// Lesson routes
router.get("/lessons/:id", getLesson);
router.get("/lessons/:id/quiz", getLessonQuiz);
router.post("/lessons/:id/submit-quiz", submitQuizValidator, submitLessonQuiz);

export default router;
