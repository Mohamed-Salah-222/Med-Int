import { Request, Response, NextFunction } from "express";
import { canAccessLesson, canAccessChapterTest, canAccessFinalExam } from "../controllers/accessController";

import UserProgress from "../models/UserProgress";
import Lesson from "../models/Lesson";
import Chapter from "../models/Chapter";

// Mock all dependencies
jest.mock("../models/UserProgress");
jest.mock("../models/Lesson");
jest.mock("../models/Chapter");

describe("Access Controller - Security & Access Control Tests", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //*=====================================================
  //* LESSON ACCESS CONTROL TESTS
  //*=====================================================

  describe("canAccessLesson", () => {
    describe("Authentication & Authorization", () => {
      test("should return 401 for unauthenticated users", async () => {
        mockRequest.params = { lessonId: "lesson123" };
        mockRequest.user = undefined;

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        expect(Lesson.findById).not.toHaveBeenCalled();
      });

      test("should grant full access to Admin users", async () => {
        mockRequest.params = { lessonId: "lesson123" };
        mockRequest.user = { userId: "admin123", role: "Admin" };

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Admin/SuperVisor access",
        });
        expect(Lesson.findById).not.toHaveBeenCalled();
      });

      test("should grant full access to SuperVisor users", async () => {
        mockRequest.params = { lessonId: "lesson123" };
        mockRequest.user = { userId: "supervisor123", role: "SuperVisor" };

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Admin/SuperVisor access",
        });
      });

      test("should NOT grant access to regular Student users without checks", async () => {
        mockRequest.params = { lessonId: "lesson123" };
        mockRequest.user = { userId: "student123", role: "Student" };

        (Lesson.findById as jest.Mock).mockResolvedValue({
          _id: "lesson123",
          chapterId: "chapter123",
          lessonNumber: 2,
        });

        (Chapter.findById as jest.Mock).mockResolvedValue({
          _id: "chapter123",
          chapterNumber: 1,
        });

        // ✅ FIX: Lesson.find needs .sort() method
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson123", lessonNumber: 2 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(null);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
      });
    });

    describe("First Lesson Access", () => {
      test("should allow access to first lesson of first chapter (no prerequisites)", async () => {
        mockRequest.params = { lessonId: "lesson1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson1",
          chapterId: "chapter1",
          lessonNumber: 1,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([{ _id: "lesson1", lessonNumber: 1 }]),
        });

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "First lesson",
        });
        expect(UserProgress.findOne).not.toHaveBeenCalled();
      });

      test("should return 404 for non-existent lesson", async () => {
        mockRequest.params = { lessonId: "nonexistent" };
        mockRequest.user = { userId: "student123", role: "Student" };

        (Lesson.findById as jest.Mock).mockResolvedValue(null);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Lesson not found" });
      });

      test("should return 404 for non-existent chapter", async () => {
        mockRequest.params = { lessonId: "lesson123" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson123",
          chapterId: "nonexistent",
          lessonNumber: 1,
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(null);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Chapter not found" });
      });
    });

    describe("Completed Lesson Re-Access", () => {
      test("should allow re-access to already completed lessons", async () => {
        mockRequest.params = { lessonId: "lesson2" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson2",
          chapterId: "chapter1",
          lessonNumber: 2,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [{ lessonId: "lesson2", passed: true }],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Lesson already completed",
        });
      });

      test("should check for PASSED status (not just attempted)", async () => {
        mockRequest.params = { lessonId: "lesson2" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson2",
          chapterId: "chapter1",
          lessonNumber: 2,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [
            { lessonId: "lesson1", passed: true },
            { lessonId: "lesson2", passed: false },
          ],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Previous lesson completed",
        });
      });
    });

    describe("Sequential Lesson Access Within Chapter", () => {
      test("should deny access if no progress exists", async () => {
        mockRequest.params = { lessonId: "lesson2" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson2",
          chapterId: "chapter1",
          lessonNumber: 2,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(null);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "You must start from Lesson 1",
        });
      });

      test("should allow access if previous lesson is completed", async () => {
        mockRequest.params = { lessonId: "lesson3" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson3",
          chapterId: "chapter1",
          lessonNumber: 3,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [
            { lessonId: "lesson1", passed: true },
            { lessonId: "lesson2", passed: true },
          ],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
            { _id: "lesson3", lessonNumber: 3 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Previous lesson completed",
        });
      });

      test("should deny access if previous lesson not completed", async () => {
        mockRequest.params = { lessonId: "lesson3" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson3",
          chapterId: "chapter1",
          lessonNumber: 3,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [{ lessonId: "lesson1", passed: true }],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
            { _id: "lesson3", lessonNumber: 3 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete Lesson 2 first",
        });
      });

      test("should provide correct lesson number in error message", async () => {
        mockRequest.params = { lessonId: "lesson5" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson5",
          chapterId: "chapter1",
          lessonNumber: 5,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [
            { lessonId: "lesson1", passed: true },
            { lessonId: "lesson2", passed: true },
            { lessonId: "lesson3", passed: true },
          ],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Add .sort() chain
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
            { _id: "lesson3", lessonNumber: 3 },
            { _id: "lesson4", lessonNumber: 4 },
            { _id: "lesson5", lessonNumber: 5 },
          ]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete Lesson 4 first",
        });
      });
    });

    describe("Chapter Boundary Access", () => {
      test("should deny access to Chapter 2 Lesson 1 if Chapter 1 incomplete", async () => {
        mockRequest.params = { lessonId: "ch2lesson1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "ch2lesson1",
          chapterId: "chapter2",
          lessonNumber: 1,
        };

        const mockChapter = {
          _id: "chapter2",
          chapterNumber: 2,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [{ lessonId: "ch1lesson1", passed: true }],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Lesson.find called twice - need different returns
        let callCount = 0;
        (Lesson.find as jest.Mock).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              sort: jest.fn().mockResolvedValue([{ _id: "ch2lesson1", lessonNumber: 1 }]),
            };
          } else {
            return Promise.resolve([
              { _id: "ch1lesson1", lessonNumber: 1 },
              { _id: "ch1lesson2", lessonNumber: 2 },
              { _id: "ch1lesson3", lessonNumber: 3 },
            ]);
          }
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete all lessons in previous chapter first",
        });
      });

      test("should allow access to Chapter 2 Lesson 1 if Chapter 1 complete", async () => {
        mockRequest.params = { lessonId: "ch2lesson1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "ch2lesson1",
          chapterId: "chapter2",
          lessonNumber: 1,
        };

        const mockChapter = {
          _id: "chapter2",
          chapterNumber: 2,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [
            { lessonId: "ch1lesson1", passed: true },
            { lessonId: "ch1lesson2", passed: true },
            { lessonId: "ch1lesson3", passed: true },
          ],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: Lesson.find called twice
        let callCount = 0;
        (Lesson.find as jest.Mock).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              sort: jest.fn().mockResolvedValue([{ _id: "ch2lesson1", lessonNumber: 1 }]),
            };
          } else {
            return Promise.resolve([
              { _id: "ch1lesson1", lessonNumber: 1 },
              { _id: "ch1lesson2", lessonNumber: 2 },
              { _id: "ch1lesson3", lessonNumber: 3 },
            ]);
          }
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Previous chapter completed",
        });
      });
    });

    describe("Edge Cases", () => {
      test("should allow access if no previous lesson exists (fallback)", async () => {
        mockRequest.params = { lessonId: "lesson2" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockLesson = {
          _id: "lesson2",
          chapterId: "chapter1",
          lessonNumber: 2,
        };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          completedLessons: [],
        };

        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        // ✅ FIX: No lesson 1 exists
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([{ _id: "lesson2", lessonNumber: 2 }]),
        });

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "No previous lesson",
        });
      });

      test("should handle database errors gracefully", async () => {
        mockRequest.params = { lessonId: "lesson123" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const dbError = new Error("Database connection failed");
        (Lesson.findById as jest.Mock).mockRejectedValue(dbError);

        await canAccessLesson(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  //*=====================================================
  //* CHAPTER TEST ACCESS CONTROL TESTS
  //*=====================================================

  describe("canAccessChapterTest", () => {
    describe("Authentication & Authorization", () => {
      test("should return 401 for unauthenticated users", async () => {
        mockRequest.params = { chapterId: "chapter123" };
        mockRequest.user = undefined;

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      });

      test("should grant full access to Admin users", async () => {
        mockRequest.params = { chapterId: "chapter123" };
        mockRequest.user = { userId: "admin123", role: "Admin" };

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Admin/SuperVisor access",
        });
      });

      test("should grant full access to SuperVisor users", async () => {
        mockRequest.params = { chapterId: "chapter123" };
        mockRequest.user = { userId: "supervisor123", role: "SuperVisor" };

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Admin/SuperVisor access",
        });
      });
    });

    describe("Chapter Completion Requirements", () => {
      test("should deny access if no progress exists", async () => {
        mockRequest.params = { chapterId: "chapter1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "lesson1", lessonNumber: 1 },
            { _id: "lesson2", lessonNumber: 2 },
          ]),
        });
        (UserProgress.findOne as jest.Mock).mockResolvedValue(null);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete all chapter lessons first",
        });
      });

      test("should allow access if user is past this chapter", async () => {
        mockRequest.params = { chapterId: "chapter1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          currentChapterNumber: 3,
          completedLessons: [],
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        });
        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Chapter completed",
        });
      });

      test("should allow access if all lessons completed in current chapter", async () => {
        mockRequest.params = { chapterId: "chapter1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockLessons = [
          { _id: "lesson1", lessonNumber: 1 },
          { _id: "lesson2", lessonNumber: 2 },
          { _id: "lesson3", lessonNumber: 3 },
        ];

        const mockProgress = {
          userId: "student123",
          currentChapterNumber: 1,
          completedLessons: [
            { lessonId: "lesson1", passed: true },
            { lessonId: "lesson2", passed: true },
            { lessonId: "lesson3", passed: true },
          ],
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockLessons),
        });
        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "All lessons completed",
        });
      });

      test("should deny access if some lessons are incomplete", async () => {
        mockRequest.params = { chapterId: "chapter1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockLessons = [
          { _id: "lesson1", lessonNumber: 1 },
          { _id: "lesson2", lessonNumber: 2 },
          { _id: "lesson3", lessonNumber: 3 },
        ];

        const mockProgress = {
          userId: "student123",
          currentChapterNumber: 1,
          completedLessons: [
            { lessonId: "lesson1", passed: true },
            { lessonId: "lesson2", passed: true },
          ],
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockLessons),
        });
        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete all 3 lessons first",
        });
      });

      test("should only count PASSED lessons (not failed attempts)", async () => {
        mockRequest.params = { chapterId: "chapter1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockLessons = [
          { _id: "lesson1", lessonNumber: 1 },
          { _id: "lesson2", lessonNumber: 2 },
        ];

        const mockProgress = {
          userId: "student123",
          currentChapterNumber: 1,
          completedLessons: [
            { lessonId: "lesson1", passed: true },
            { lessonId: "lesson2", passed: false },
          ],
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockLessons),
        });
        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete all 2 lessons first",
        });
      });
    });

    describe("Edge Cases", () => {
      test("should return 404 for non-existent chapter", async () => {
        mockRequest.params = { chapterId: "nonexistent" };
        mockRequest.user = { userId: "student123", role: "Student" };

        (Chapter.findById as jest.Mock).mockResolvedValue(null);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Chapter not found" });
      });

      test("should handle chapter with zero lessons", async () => {
        mockRequest.params = { chapterId: "chapter1" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockChapter = {
          _id: "chapter1",
          chapterNumber: 1,
        };

        const mockProgress = {
          userId: "student123",
          currentChapterNumber: 1,
          completedLessons: [],
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Lesson.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        });
        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "All lessons completed",
        });
      });

      test("should handle database errors gracefully", async () => {
        mockRequest.params = { chapterId: "chapter123" };
        mockRequest.user = { userId: "student123", role: "Student" };

        const dbError = new Error("Connection timeout");
        (Chapter.findById as jest.Mock).mockRejectedValue(dbError);

        await canAccessChapterTest(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });
  });

  //*=====================================================
  //* FINAL EXAM ACCESS CONTROL TESTS
  //*=====================================================

  describe("canAccessFinalExam", () => {
    describe("Authentication & Authorization", () => {
      test("should return 401 for unauthenticated users", async () => {
        mockRequest.user = undefined;

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      });

      test("should grant full access to Admin users", async () => {
        mockRequest.user = { userId: "admin123", role: "Admin" };

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Admin/SuperVisor access",
        });
      });

      test("should grant full access to SuperVisor users", async () => {
        mockRequest.user = { userId: "supervisor123", role: "SuperVisor" };

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "Admin/SuperVisor access",
        });
      });
    });

    describe("Chapter Test Requirements", () => {
      test("should deny access if no progress exists", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(null);

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Complete all chapters first",
        });
      });

      test("should deny access if no chapter tests passed", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "ch1", chapterNumber: 1 },
            { _id: "ch2", chapterNumber: 2 },
            { _id: "ch3", chapterNumber: 3 },
          ]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Pass all 3 chapter tests first. You've passed 0/3",
        });
      });

      test("should deny access if some chapter tests passed but not all", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [
            { chapterId: "ch1", passed: true },
            { chapterId: "ch2", passed: true },
            { chapterId: "ch3", passed: false },
          ],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "ch1", chapterNumber: 1 },
            { _id: "ch2", chapterNumber: 2 },
            { _id: "ch3", chapterNumber: 3 },
          ]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Pass all 3 chapter tests first. You've passed 2/3",
        });
      });

      test("should allow access if all chapter tests passed", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [
            { chapterId: "ch1", passed: true },
            { chapterId: "ch2", passed: true },
            { chapterId: "ch3", passed: true },
          ],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "ch1", chapterNumber: 1 },
            { _id: "ch2", chapterNumber: 2 },
            { _id: "ch3", chapterNumber: 3 },
          ]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "All requirements met",
        });
      });

      test("should only count PASSED attempts (not failed)", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [
            { chapterId: "ch1", passed: true },
            { chapterId: "ch1", passed: false },
            { chapterId: "ch2", passed: true },
            { chapterId: "ch3", passed: false },
            { chapterId: "ch3", passed: false },
            { chapterId: "ch3", passed: true },
          ],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "ch1", chapterNumber: 1 },
            { _id: "ch2", chapterNumber: 2 },
            { _id: "ch3", chapterNumber: 3 },
          ]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "All requirements met",
        });
      });
    });

    describe("Progress Feedback", () => {
      test("should provide accurate count of passed tests", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [
            { chapterId: "ch1", passed: true },
            { chapterId: "ch2", passed: true },
            { chapterId: "ch3", passed: false },
            { chapterId: "ch4", passed: false },
            { chapterId: "ch5", passed: false },
          ],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "ch1", chapterNumber: 1 },
            { _id: "ch2", chapterNumber: 2 },
            { _id: "ch3", chapterNumber: 3 },
            { _id: "ch4", chapterNumber: 4 },
            { _id: "ch5", chapterNumber: 5 },
          ]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Pass all 5 chapter tests first. You've passed 2/5",
        });
      });

      test("should show total required chapter tests", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: "ch1", chapterNumber: 1 },
            { _id: "ch2", chapterNumber: 2 },
            { _id: "ch3", chapterNumber: 3 },
            { _id: "ch4", chapterNumber: 4 },
            { _id: "ch5", chapterNumber: 5 },
            { _id: "ch6", chapterNumber: 6 },
            { _id: "ch7", chapterNumber: 7 },
          ]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: false,
          message: "Pass all 7 chapter tests first. You've passed 0/7",
        });
      });
    });

    describe("Edge Cases", () => {
      test("should handle database errors gracefully", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const dbError = new Error("Database query failed");
        (UserProgress.findOne as jest.Mock).mockRejectedValue(dbError);

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });

      test("should handle zero chapters edge case", async () => {
        mockRequest.user = { userId: "student123", role: "Student" };

        const mockProgress = {
          userId: "student123",
          chapterTestAttempts: [],
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
        (Chapter.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        });

        await canAccessFinalExam(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          canAccess: true,
          reason: "All requirements met",
        });
      });
    });
  });
});
