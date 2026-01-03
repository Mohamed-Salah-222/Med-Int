import express from "express";
import { getCourse, getChapter, getLesson, getLessonQuiz, submitLessonQuiz, getUserProgress, getChapterTest, submitFinalExam, getDetailedProgress, getUserCertificate, verifyCertificate, getUserCertificates, startChapterTest, abandonChapterTest, getFinalExam, submitChapterTest } from "../controllers/courseController";
import { submitQuizValidator, submitTestValidator, submitExamValidator } from "../validators/courseValidator";
import authMiddleware from "../middleware/authMiddleware";
import { requireStudent } from "../middleware/roleMiddleware";

import { generateCertificate } from "../services/certificateGenerator";
import Certificate from "../models/Certificate";
import { generateCertificateNumber, generateVerificationCode } from "../utils/certificateGenerator";

const router = express.Router();

// ========================================
// PUBLIC ROUTES (no auth required)
// MUST be BEFORE authMiddleware
// ========================================
router.get("/verify-certificate", verifyCertificate);
router.get("/:id", getCourse); // Course detail is now public!

// ========================================
// PROTECTED ROUTES
// All routes below require authentication AND Student role
// ========================================
router.use(authMiddleware);
router.use(requireStudent);

// Course routes (protected)
router.get("/:id/exam", getFinalExam);
router.post("/:id/submit-exam", submitExamValidator, submitFinalExam);
router.get("/:courseId/progress", getUserProgress);
router.get("/:courseId/detailed-progress", getDetailedProgress);
router.get("/:courseId/certificate", getUserCertificate);
router.get("/:courseId/certificates", getUserCertificates);

// Chapter routes (protected)
router.get("/chapters/:id", getChapter);
router.get("/chapters/:id/test", getChapterTest);
router.post("/chapters/:id/test/start", startChapterTest);
router.post("/chapters/:id/test/submit", submitChapterTest);
router.post("/chapters/:id/test/abandon", abandonChapterTest);

// Lesson routes (protected)
router.get("/lessons/:id", getLesson);
router.get("/lessons/:id/quiz", getLessonQuiz);
router.post("/lessons/:id/submit-quiz", submitQuizValidator, submitLessonQuiz);

export default router;
