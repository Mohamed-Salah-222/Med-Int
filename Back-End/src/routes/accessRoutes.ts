import express from "express";
import { canAccessLesson, canAccessChapterTest, canAccessFinalExam } from "../controllers/accessController";
import authMiddleware from "../middleware/authMiddleware";
import { requireStudent } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/lesson/:lessonId", authMiddleware, requireStudent, canAccessLesson);
router.get("/chapter-test/:chapterId", authMiddleware, requireStudent, canAccessChapterTest);
router.get("/final-exam", authMiddleware, requireStudent, canAccessFinalExam);

export default router;
