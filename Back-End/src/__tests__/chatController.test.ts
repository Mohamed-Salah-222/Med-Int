import { Request, Response, NextFunction } from "express";
import { getChatUsage, sendChatMessage } from "../controllers/chatbotController";

import ChatUsage from "../models/ChatUsage";
import Lesson from "../models/Lesson";
import Chapter from "../models/Chapter";
import OpenAI from "openai";

// Mock all dependencies
jest.mock("../models/ChatUsage");
jest.mock("../models/Lesson");
jest.mock("../models/Chapter");
jest.mock("openai");

describe("Chat Controller - AI Tutor Tests", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Set up environment variable
    process.env.OPENAI_API_KEY = "test-api-key";
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  //*=====================================================
  //* CHAT USAGE TESTS
  //*=====================================================

  describe("getChatUsage", () => {
    test("should return usage stats for existing usage", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = { userId: "user123" };

      const mockUsage = {
        userId: "user123",
        lessonId: "lesson123",
        messageCount: 7,
        lastMessageAt: new Date(),
      };

      (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(ChatUsage.findOne).toHaveBeenCalledWith({
        userId: "user123",
        lessonId: "lesson123",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        messageCount: 7,
        remainingMessages: 8, // 15 - 7
        limit: 15,
      });
    });

    test("should return zero usage for new user (no usage record)", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = { userId: "newuser123" };

      (ChatUsage.findOne as jest.Mock).mockResolvedValue(null);

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        messageCount: 0,
        remainingMessages: 15,
        limit: 15,
      });
    });

    test("should calculate remaining messages correctly", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = { userId: "user123" };

      const mockUsage = {
        messageCount: 14, // Almost at limit
      };

      (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        messageCount: 14,
        remainingMessages: 1,
        limit: 15,
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = undefined;

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(ChatUsage.findOne).not.toHaveBeenCalled();
    });

    test("should handle database query failure", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = { userId: "user123" };

      const dbError = new Error("Database connection failed");
      (ChatUsage.findOne as jest.Mock).mockRejectedValue(dbError);

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should return correct limit constant (15)", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = { userId: "user123" };

      (ChatUsage.findOne as jest.Mock).mockResolvedValue(null);

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ limit: 15 }));
    });

    test("should handle non-existent lessonId gracefully", async () => {
      mockRequest.params = { lessonId: "nonexistent" };
      mockRequest.user = { userId: "user123" };

      (ChatUsage.findOne as jest.Mock).mockResolvedValue(null);

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        messageCount: 0,
        remainingMessages: 15,
        limit: 15,
      });
    });

    test("should return proper JSON structure", async () => {
      mockRequest.params = { lessonId: "lesson123" };
      mockRequest.user = { userId: "user123" };

      (ChatUsage.findOne as jest.Mock).mockResolvedValue({ messageCount: 5 });

      await getChatUsage(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        messageCount: expect.any(Number),
        remainingMessages: expect.any(Number),
        limit: expect.any(Number),
      });
    });
  });

  //*=====================================================
  //* SEND CHAT MESSAGE TESTS
  //*=====================================================

  describe("sendChatMessage", () => {
    describe("Authentication & Validation", () => {
      test("should return 401 for unauthenticated users", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "What is medical interpretation?",
        };
        mockRequest.user = undefined;

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        expect(ChatUsage.findOne).not.toHaveBeenCalled();
      });

      test("should return 400 for empty message", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "",
        };
        mockRequest.user = { userId: "user123" };

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Message cannot be empty",
        });
      });

      test("should return 400 for whitespace-only message", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "   \n\t   ",
        };
        mockRequest.user = { userId: "user123" };

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Message cannot be empty",
        });
      });

      test("should return 404 for non-existent lesson", async () => {
        mockRequest.body = {
          lessonId: "nonexistent",
          message: "What is this lesson about?",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = {
          userId: "user123",
          lessonId: "nonexistent",
          messageCount: 0,
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        });

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Lesson not found" });
      });

      test("should validate message exists in request body", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          // message missing!
        };
        mockRequest.user = { userId: "user123" };

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });
    });

    describe("Message Limiting", () => {
      test("should create usage record if none exists", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Hello, AI tutor!",
        };
        mockRequest.user = { userId: "newuser123" };

        const mockLesson = {
          _id: "lesson123",
          title: "Introduction to Medical Terms",
          lessonNumber: 1,
          content: "<p>This is the lesson content</p>",
          chapterId: "chapter123",
        };

        const mockChapter = {
          _id: "chapter123",
          title: "Medical Terminology",
        };

        const mockCreatedUsage = {
          userId: "newuser123",
          lessonId: "lesson123",
          messageCount: 0,
          lastMessageAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(null); // No existing usage
        (ChatUsage.create as jest.Mock).mockResolvedValue(mockCreatedUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // Mock OpenAI
        const mockCompletion = {
          choices: [{ message: { content: "Hello! How can I help you?" } }],
        };

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockResolvedValue(mockCompletion),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(ChatUsage.create).toHaveBeenCalledWith({
          userId: "newuser123",
          lessonId: "lesson123",
          messageCount: 0,
          lastMessageAt: expect.any(Date),
        });

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should return 429 when limit reached (15 messages)", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "One more question...",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = {
          userId: "user123",
          lessonId: "lesson123",
          messageCount: 15, // At limit!
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(429);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Message limit reached for this lesson",
          messageCount: 15,
          limit: 15,
        });

        expect(Lesson.findById).not.toHaveBeenCalled(); // Should stop before fetching lesson
      });

      test("should increment message count after successful response", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Explain this concept",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = {
          userId: "user123",
          lessonId: "lesson123",
          messageCount: 5,
          lastMessageAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        const mockLesson = {
          _id: "lesson123",
          title: "Medical Terms",
          lessonNumber: 1,
          content: "<p>Content here</p>",
          chapterId: "chapter123",
        };

        const mockChapter = {
          _id: "chapter123",
          title: "Chapter 1",
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCompletion = {
          choices: [{ message: { content: "AI response here" } }],
        };

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockResolvedValue(mockCompletion),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockUsage.messageCount).toBe(6); // Incremented from 5 to 6
        expect(mockUsage.save).toHaveBeenCalled();
      });

      test("should update lastMessageAt timestamp", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Test message",
        };
        mockRequest.user = { userId: "user123" };

        const oldDate = new Date("2024-01-01");
        const mockUsage = {
          userId: "user123",
          lessonId: "lesson123",
          messageCount: 3,
          lastMessageAt: oldDate,
          save: jest.fn().mockResolvedValue(true),
        };

        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };

        const mockChapter = {
          _id: "chapter123",
          title: "Chapter",
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCompletion = {
          choices: [{ message: { content: "Response" } }],
        };

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockResolvedValue(mockCompletion),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockUsage.lastMessageAt).not.toBe(oldDate);
        expect(mockUsage.lastMessageAt).toBeInstanceOf(Date);
      });
    });

    describe("OpenAI Integration", () => {
      test("should call OpenAI API with correct parameters", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "What is triage?",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = {
          messageCount: 0,
          save: jest.fn().mockResolvedValue(true),
        };

        const mockLesson = {
          _id: "lesson123",
          title: "Emergency Medical Terms",
          lessonNumber: 1,
          content: "<p>Triage is the process of determining priority...</p>",
          chapterId: "chapter123",
        };

        const mockChapter = {
          _id: "chapter123",
          title: "Emergency Medicine",
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Triage is..." } }],
        });

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: mockCreate,
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockCreate).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: expect.any(Array),
          max_tokens: 500,
          temperature: 0.7,
        });
      });

      test("should include system prompt with lesson context", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Explain this",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = {
          messageCount: 0,
          save: jest.fn().mockResolvedValue(true),
        };

        const mockLesson = {
          _id: "lesson123",
          title: "Medical Ethics",
          lessonNumber: 5,
          content: "<p>Medical ethics involves principles like autonomy...</p>",
          chapterId: "chapter123",
        };

        const mockChapter = {
          _id: "chapter123",
          title: "Professional Standards",
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Response" } }],
        });

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: mockCreate,
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        const messages = mockCreate.mock.calls[0][0].messages;
        const systemMessage = messages[0];

        expect(systemMessage.role).toBe("system");
        expect(systemMessage.content).toContain("Professional Standards");
        expect(systemMessage.content).toContain("Lesson 5: Medical Ethics");
      });

      test("should include conversation history", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Tell me more",
          conversationHistory: [
            { role: "user", content: "What is HIPAA?" },
            { role: "assistant", content: "HIPAA is a privacy law..." },
          ],
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = {
          messageCount: 2,
          save: jest.fn().mockResolvedValue(true),
        };

        const mockLesson = {
          _id: "lesson123",
          title: "Privacy Laws",
          lessonNumber: 3,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };

        const mockChapter = {
          _id: "chapter123",
          title: "Legal Aspects",
        };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{ message: { content: "More about HIPAA..." } }],
        });

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: mockCreate,
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        const messages = mockCreate.mock.calls[0][0].messages;

        expect(messages).toHaveLength(4); // system + 2 history + user message
        expect(messages[1]).toEqual({ role: "user", content: "What is HIPAA?" });
        expect(messages[2]).toEqual({ role: "assistant", content: "HIPAA is a privacy law..." });
        expect(messages[3]).toEqual({ role: "user", content: "Tell me more" });
      });

      test("should limit tokens to 500", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn().mockResolvedValue(true) };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Response" } }],
        });

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: mockCreate,
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 500 }));
      });

      test("should use temperature 0.7", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn().mockResolvedValue(true) };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Response" } }],
        });

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: mockCreate,
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.7 }));
      });

      test("should use gpt-4o-mini model", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn().mockResolvedValue(true) };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Response" } }],
        });

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: mockCreate,
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o-mini" }));
      });
    });

    describe("Response Handling", () => {
      test("should return AI response in correct format", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Test question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 5, save: jest.fn().mockResolvedValue(true) };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCompletion = {
          choices: [{ message: { content: "This is the AI response!" } }],
        };

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockResolvedValue(mockCompletion),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          response: "This is the AI response!",
          timestamp: expect.any(String),
          messageCount: 6,
          remainingMessages: 9,
        });
      });

      test("should return timestamp in ISO format", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn().mockResolvedValue(true) };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCompletion = {
          choices: [{ message: { content: "Response" } }],
        };

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockResolvedValue(mockCompletion),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
        expect(responseData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      test("should return updated message count and remaining", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 10, save: jest.fn().mockResolvedValue(true) };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const mockCompletion = {
          choices: [{ message: { content: "Response" } }],
        };

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockResolvedValue(mockCompletion),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            messageCount: 11,
            remainingMessages: 4, // 15 - 11
          })
        );
      });
    });

    describe("Error Handling", () => {
      test("should handle missing OPENAI_API_KEY", async () => {
        delete process.env.OPENAI_API_KEY;

        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn() };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "AI service configuration error. Please contact support.",
        });
      });

      test("should handle insufficient_quota error (429)", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn() };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const quotaError = new Error("Quota exceeded");
        (quotaError as any).code = "insufficient_quota";

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockRejectedValue(quotaError),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(429);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "AI service temporarily unavailable. Please try again later.",
        });
      });

      test("should handle OpenAI API errors gracefully", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const mockUsage = { messageCount: 0, save: jest.fn() };
        const mockLesson = {
          _id: "lesson123",
          title: "Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          chapterId: "chapter123",
        };
        const mockChapter = { _id: "chapter123", title: "Chapter" };

        (ChatUsage.findOne as jest.Mock).mockResolvedValue(mockUsage);
        (Lesson.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLesson),
        });
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        const apiError = new Error("Network timeout");

        (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
          () =>
            ({
              chat: {
                completions: {
                  create: jest.fn().mockRejectedValue(apiError),
                },
              },
            } as any)
        );

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(apiError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      test("should pass unexpected errors to middleware", async () => {
        mockRequest.body = {
          lessonId: "lesson123",
          message: "Question",
        };
        mockRequest.user = { userId: "user123" };

        const unexpectedError = new Error("Something went wrong");
        (ChatUsage.findOne as jest.Mock).mockRejectedValue(unexpectedError);

        await sendChatMessage(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      });
    });
  });
});
