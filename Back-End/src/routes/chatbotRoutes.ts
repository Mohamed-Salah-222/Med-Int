import express from "express";
import { sendChatMessage, getChatUsage } from "../controllers/chatbotController";
import authMiddleware from "../middleware/authMiddleware";
import { requireStudent } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/usage/:lessonId", authMiddleware, requireStudent, getChatUsage);
router.post("/message", authMiddleware, requireStudent, sendChatMessage);

export default router;
