import express from "express";
import { sendChatMessage, getChatUsage } from "../controllers/chatbotController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.get("/usage/:lessonId", authMiddleware, getChatUsage);
router.post("/message", authMiddleware, sendChatMessage);

export default router;
