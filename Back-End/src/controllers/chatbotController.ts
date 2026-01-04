import { Request, Response, NextFunction } from "express";
import OpenAI from "openai";
import Lesson from "../models/Lesson";
import Chapter from "../models/Chapter";
import ChatUsage from "../models/ChatUsage";

//*=====================================================
//* TYPE DEFINITIONS
//*=====================================================

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

//*=====================================================
//* CONSTANTS
//*=====================================================

const MESSAGE_LIMIT = 15;

//*=====================================================
//* UTILITY FUNCTIONS
//*=====================================================

//*--- Initialize OpenAI Client (Lazy Loading)
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

//*--- Strip HTML Tags from Content
const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

//*=====================================================
//* CHAT USAGE TRACKING
//*=====================================================

//*--- Get Chat Usage Statistics for Lesson
export const getChatUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const usage = await ChatUsage.findOne({ userId, lessonId });

    res.status(200).json({
      messageCount: usage?.messageCount || 0,
      remainingMessages: MESSAGE_LIMIT - (usage?.messageCount || 0),
      limit: MESSAGE_LIMIT,
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* AI CHAT INTERACTION
//*=====================================================

//*--- Send Message to AI Tutor
export const sendChatMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lessonId, message, conversationHistory } = req.body;
    const userId = req.user?.userId;

    // Authentication check
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Message validation
    if (!message || message.trim().length === 0) {
      res.status(400).json({ message: "Message cannot be empty" });
      return;
    }

    // Get or create usage tracking
    let usage = await ChatUsage.findOne({ userId, lessonId });

    if (!usage) {
      usage = await ChatUsage.create({
        userId,
        lessonId,
        messageCount: 0,
        lastMessageAt: new Date(),
      });
    }

    // Check message limit
    if (usage.messageCount >= MESSAGE_LIMIT) {
      res.status(429).json({
        message: "Message limit reached for this lesson",
        messageCount: usage.messageCount,
        limit: MESSAGE_LIMIT,
      });
      return;
    }

    // Get lesson content for AI context
    const lesson = await Lesson.findById(lessonId).populate("chapterId");

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    const chapter = await Chapter.findById(lesson.chapterId);

    // Prepare lesson content for system prompt
    const lessonText = stripHtml(lesson.content);

    // Build system prompt with lesson context
    const systemPrompt = `You are an expert medical interpreter tutor helping a student learn from their course.

**Current Context:**
- Chapter: ${chapter?.title || "Unknown Chapter"}
- Lesson ${lesson.lessonNumber}: ${lesson.title}

**Lesson Content Summary:**
${lessonText.substring(0, 1500)}... (content truncated)

**Your Role:**
- Answer questions clearly and concisely about medical interpretation
- Reference the lesson content when relevant
- Use simple language for B2 English level students
- Encourage students to think critically
- If asked about quiz answers, guide them to learn rather than giving direct answers
- Keep responses under 200 words unless asked for more detail

**Limitations:**
- Stay focused on medical interpretation topics
- Don't provide medical diagnoses or advice
- Don't help with unethical behavior (cheating, etc.)`;

    // Build conversation messages
    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...(conversationHistory || []), { role: "user", content: message }];

    // Initialize OpenAI client
    const openai = getOpenAIClient();

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Increment message count and update timestamp
    usage.messageCount += 1;
    usage.lastMessageAt = new Date();
    await usage.save();

    res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      messageCount: usage.messageCount,
      remainingMessages: MESSAGE_LIMIT - usage.messageCount,
    });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);

    // Handle OpenAI quota errors
    if (error.code === "insufficient_quota") {
      res.status(429).json({
        message: "AI service temporarily unavailable. Please try again later.",
      });
      return;
    }

    // Handle API key configuration errors
    if (error.message && error.message.includes("OPENAI_API_KEY")) {
      res.status(500).json({
        message: "AI service configuration error. Please contact support.",
      });
      return;
    }

    next(error);
  }
};
