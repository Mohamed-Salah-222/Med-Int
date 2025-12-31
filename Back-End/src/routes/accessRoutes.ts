import express from "express";
import { canAccessLesson, canAccessChapterTest, canAccessFinalExam } from "../controllers/accessController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.get("/lesson/:lessonId", authMiddleware, canAccessLesson);
router.get("/chapter-test/:chapterId", authMiddleware, canAccessChapterTest);
router.get("/final-exam", authMiddleware, canAccessFinalExam);

export default router;
