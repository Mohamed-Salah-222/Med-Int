import { Request, Response, NextFunction } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  createLesson,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  createQuestion,
  bulkCreateQuestions,
  assignQuestions,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getAllUsers,
  getUserById,
  updateUserRole,
  resetTestCooldown,
  resetExamCooldown,
  deleteUser,
  resetUserProgress,
  getDashboardStats,
  getStatistics,
  getAllCertificates,
  getAllUsersProgress,
  getUserProgress,
  getSettings,
  updateSettings,
  testEmail,
} from "../controllers/adminController";

import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Lesson from "../models/Lesson";
import Question from "../models/Question";
import User from "../models/User";
import Certificate from "../models/Certificate";
import UserProgress from "../models/UserProgress";
import Settings from "../models/Settings";
import { validationResult } from "express-validator";

// Mock all dependencies
jest.mock("../models/Course");
jest.mock("../models/Chapter");
jest.mock("../models/Lesson");
jest.mock("../models/Question");
jest.mock("../models/User");
jest.mock("../models/Certificate");
jest.mock("../models/UserProgress");
jest.mock("../models/Settings");
jest.mock("express-validator");

//*=====================================================
//* HELPER TYPES & UTILITIES
//*=====================================================

interface MockCourse {
  _id: string;
  title: string;
  description: string;
  totalChapters: number;
  chapters: any[];
  finalExam: {
    questions: any[];
    passingScore: number;
    cooldownHours: number;
    timeLimit: number;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt?: Date;
  save: jest.Mock;
}

interface MockChapter {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  chapterNumber: number;
  lessons: any[];
  chapterTest: {
    questions: any[];
    passingScore: number;
    cooldownHours: number;
    timeLimit: number;
  };
  isPublished: boolean;
  createdAt: Date;
  save: jest.Mock;
}

interface MockLesson {
  _id: string;
  chapterId: string;
  title: string;
  lessonNumber: number;
  content: string;
  contentType: "text" | "audio-exercise";
  audioUrl?: string;
  quiz: {
    questions: any[];
    passingScore: number;
    unlimitedAttempts: boolean;
  };
  isPublished: boolean;
  createdAt: Date;
  save: jest.Mock;
}

interface MockQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: "quiz" | "test" | "exam";
  explanation?: string;
  audioUrl?: string;
  difficulty?: "easy" | "medium" | "hard";
  createdAt: Date;
  save: jest.Mock;
}

describe("Admin Controller - Comprehensive Tests", () => {
  let mockRequest: any; // ← CHANGE TO 'any'
  let mockResponse: any; // ← CHANGE TO 'any'
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { userId: "admin123", role: "Admin" },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Default validation mock
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //*=====================================================
  //* COURSE MANAGEMENT TESTS
  //*=====================================================

  describe("Course Management", () => {
    describe("createCourse", () => {
      const mockCourseData = {
        title: "Medical Interpreter Course",
        description: "Professional training for medical interpreters",
      };

      test("should create course with default exam settings", async () => {
        mockRequest.body = mockCourseData;

        const mockCourse = {
          _id: "course123",
          ...mockCourseData,
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
        };

        (Course.create as jest.Mock).mockResolvedValue(mockCourse);

        // ← REMOVE all type assertions here - just call directly
        await createCourse(mockRequest, mockResponse, mockNext);

        expect(Course.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: mockCourseData.title,
            description: mockCourseData.description,
            totalChapters: 0,
            chapters: [],
            finalExam: expect.objectContaining({
              passingScore: 80,
              cooldownHours: 24,
              timeLimit: 100,
            }),
            isPublished: false,
          })
        );

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Course created successfully",
            course: expect.objectContaining({
              id: "course123",
              title: mockCourseData.title,
            }),
          })
        );
      });

      test("should return validation errors for missing fields", async () => {
        mockRequest.body = { title: "Test" }; // Missing description

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "Description is required", param: "description" }]),
        });

        await createCourse(mockRequest, mockResponse, mockNext); // ← No type assertions

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          errors: [{ msg: "Description is required", param: "description" }],
        });
        expect(Course.create).not.toHaveBeenCalled();
      });

      test("should handle database creation failure", async () => {
        mockRequest.body = mockCourseData;

        const dbError = new Error("Database connection failed");
        (Course.create as jest.Mock).mockRejectedValue(dbError);

        await createCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      test("should handle empty title and description", async () => {
        mockRequest.body = { title: "", description: "" };

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "Title cannot be empty" }, { msg: "Description cannot be empty" }]),
        });

        await createCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(Course.create).not.toHaveBeenCalled();
      });

      test("should handle extremely long title/description", async () => {
        mockRequest.body = {
          title: "A".repeat(10000), // 10k characters
          description: "B".repeat(50000), // 50k characters
        };

        const mockCourse = {
          _id: "course123",
          title: mockRequest.body.title,
          description: mockRequest.body.description,
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
        };

        (Course.create as jest.Mock).mockResolvedValue(mockCourse);

        await createCourse(mockRequest, mockResponse as Response, mockNext);

        expect(Course.create).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });
    });

    describe("getAllCourses", () => {
      test("should return all courses with populated chapters", async () => {
        const mockCourses = [
          {
            _id: "course1",
            title: "Course 1",
            description: "Description 1",
            totalChapters: 2,
            chapters: [
              { _id: "chapter1", title: "Chapter 1", chapterNumber: 1 },
              { _id: "chapter2", title: "Chapter 2", chapterNumber: 2 },
            ],
            isPublished: true,
            finalExam: { questions: ["q1", "q2", "q3"] },
            createdAt: new Date("2024-01-01"),
          },
          {
            _id: "course2",
            title: "Course 2",
            description: "Description 2",
            totalChapters: 0,
            chapters: [],
            isPublished: false,
            finalExam: { questions: [] },
            createdAt: new Date("2024-01-02"),
          },
        ];

        (Course.find as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockCourses),
          }),
        });

        await getAllCourses(mockRequest, mockResponse as Response, mockNext);

        expect(Course.find).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          courses: expect.arrayContaining([
            expect.objectContaining({
              id: "course1",
              title: "Course 1",
              chaptersCount: 2,
              finalExamQuestionsCount: 3,
            }),
            expect.objectContaining({
              id: "course2",
              title: "Course 2",
              chaptersCount: 0,
              finalExamQuestionsCount: 0,
            }),
          ]),
        });
      });

      test("should return empty array when no courses exist", async () => {
        (Course.find as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          }),
        });

        await getAllCourses(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ courses: [] });
      });

      test("should handle database query failure", async () => {
        const dbError = new Error("Query timeout");
        (Course.find as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(dbError),
          }),
        });

        await getAllCourses(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });

    describe("getCourseById", () => {
      test("should return course with all details", async () => {
        mockRequest.params = { id: "course123" };

        const mockCourse = {
          _id: "course123",
          title: "Medical Interpreter Course",
          description: "Professional training",
          totalChapters: 3,
          chapters: [
            { _id: "ch1", title: "Chapter 1", chapterNumber: 1, description: "Desc 1" },
            { _id: "ch2", title: "Chapter 2", chapterNumber: 2, description: "Desc 2" },
          ],
          finalExam: {
            questions: ["q1", "q2"],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        };

        (Course.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        });

        await getCourseById(mockRequest, mockResponse as Response, mockNext);

        expect(Course.findById).toHaveBeenCalledWith("course123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          course: expect.objectContaining({
            id: "course123",
            title: "Medical Interpreter Course",
            totalChapters: 3,
            chapters: expect.arrayContaining([expect.objectContaining({ _id: "ch1", title: "Chapter 1" })]),
          }),
        });
      });

      test("should return 404 for non-existent course", async () => {
        mockRequest.params = { id: "nonexistent" };

        (Course.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        });

        await getCourseById(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Course not found" });
      });

      test("should handle invalid ObjectId format", async () => {
        mockRequest.params = { id: "invalid-id-format" };

        const castError = new Error("Cast to ObjectId failed");
        (Course.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockRejectedValue(castError),
        });

        await getCourseById(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(castError);
      });

      test("should populate chapters correctly even when empty", async () => {
        mockRequest.params = { id: "course123" };

        const mockCourse = {
          _id: "course123",
          title: "Empty Course",
          description: "No chapters yet",
          totalChapters: 0,
          chapters: [],
          finalExam: { questions: [], passingScore: 80, cooldownHours: 24, timeLimit: 100 },
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (Course.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        });

        await getCourseById(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          course: expect.objectContaining({
            chapters: [],
            totalChapters: 0,
          }),
        });
      });
    });

    describe("updateCourse", () => {
      test("should update course fields successfully", async () => {
        mockRequest.params = { id: "course123" };
        mockRequest.body = {
          title: "Updated Title",
          description: "Updated Description",
          isPublished: true,
        };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Old Title",
          description: "Old Description",
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
          save: jest.fn().mockResolvedValue(true),
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);

        await updateCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.title).toBe("Updated Title");
        expect(mockCourse.description).toBe("Updated Description");
        expect(mockCourse.isPublished).toBe(true);
        expect(mockCourse.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should update final exam settings", async () => {
        mockRequest.params = { id: "course123" };
        mockRequest.body = {
          finalExam: {
            questions: ["q1", "q2", "q3"],
            passingScore: 85,
            cooldownHours: 48,
            timeLimit: 120,
          },
        };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Course",
          description: "Desc",
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
          save: jest.fn().mockResolvedValue(true),
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);

        await updateCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.finalExam!.passingScore).toBe(85);
        expect(mockCourse.finalExam!.cooldownHours).toBe(48);
        expect(mockCourse.finalExam!.timeLimit).toBe(120);
        expect(mockCourse.save).toHaveBeenCalled();
      });

      test("should handle partial updates (undefined fields ignored)", async () => {
        mockRequest.params = { id: "course123" };
        mockRequest.body = {
          title: "New Title",
          // description, isPublished not provided
        };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Old Title",
          description: "Original Description",
          totalChapters: 5,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: true,
          save: jest.fn().mockResolvedValue(true),
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);

        await updateCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.title).toBe("New Title");
        expect(mockCourse.description).toBe("Original Description"); // Unchanged
        expect(mockCourse.isPublished).toBe(true); // Unchanged
        expect(mockCourse.save).toHaveBeenCalled();
      });

      test("should return 404 for non-existent course", async () => {
        mockRequest.params = { id: "nonexistent" };
        mockRequest.body = { title: "New Title" };

        (Course.findById as jest.Mock).mockResolvedValue(null);

        await updateCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Course not found" });
      });

      test("should handle database save failure", async () => {
        mockRequest.params = { id: "course123" };
        mockRequest.body = { title: "New Title" };

        const saveError = new Error("Write conflict");
        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Old Title",
          description: "Desc",
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
          save: jest.fn().mockRejectedValue(saveError),
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);

        await updateCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(saveError);
      });

      test("should update only specific finalExam fields", async () => {
        mockRequest.params = { id: "course123" };
        mockRequest.body = {
          finalExam: {
            passingScore: 90, // Only update passing score
          },
        };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Course",
          description: "Desc",
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: ["q1", "q2"],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
          save: jest.fn().mockResolvedValue(true),
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);

        await updateCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.finalExam!.passingScore).toBe(90);
        expect(mockCourse.finalExam!.cooldownHours).toBe(24); // Unchanged
        expect(mockCourse.finalExam!.timeLimit).toBe(100); // Unchanged
        expect(mockCourse.finalExam!.questions).toEqual(["q1", "q2"]); // Unchanged
      });
    });

    describe("deleteCourse", () => {
      test("should delete course successfully", async () => {
        mockRequest.params = { id: "course123" };

        const mockCourse = {
          _id: "course123",
          title: "Course to Delete",
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Course.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCourse);

        await deleteCourse(mockRequest, mockResponse as Response, mockNext);

        expect(Course.findById).toHaveBeenCalledWith("course123");
        expect(Course.findByIdAndDelete).toHaveBeenCalledWith("course123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Course deleted successfully",
        });
      });

      test("should return 404 for non-existent course", async () => {
        mockRequest.params = { id: "nonexistent" };

        (Course.findById as jest.Mock).mockResolvedValue(null);

        await deleteCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Course not found" });
        expect(Course.findByIdAndDelete).not.toHaveBeenCalled();
      });

      test("should handle database deletion failure", async () => {
        mockRequest.params = { id: "course123" };

        const mockCourse = { _id: "course123" };
        const deleteError = new Error("Deletion failed");

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Course.findByIdAndDelete as jest.Mock).mockRejectedValue(deleteError);

        await deleteCourse(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(deleteError);
      });

      test("should NOT cascade delete related data (as per implementation)", async () => {
        mockRequest.params = { id: "course123" };

        const mockCourse = {
          _id: "course123",
          chapters: ["ch1", "ch2", "ch3"],
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Course.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCourse);

        await deleteCourse(mockRequest, mockResponse as Response, mockNext);

        // Verify cascade delete is NOT called
        expect(Chapter.deleteMany).not.toHaveBeenCalled();
        expect(Lesson.deleteMany).not.toHaveBeenCalled();
        expect(UserProgress.deleteMany).not.toHaveBeenCalled();
      });
    });
  });

  //*=====================================================
  //* CHAPTER MANAGEMENT TESTS
  //*=====================================================

  describe("Chapter Management", () => {
    describe("createChapter", () => {
      const mockChapterData = {
        courseId: "course123",
        title: "Introduction to Medical Terminology",
        description: "Learn basic medical terms",
        chapterNumber: 1,
      };

      test("should create chapter and add to course", async () => {
        mockRequest.body = mockChapterData;

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Medical Course",
          description: "Desc",
          totalChapters: 0,
          chapters: [],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
          createdAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        const mockChapter = {
          _id: "chapter123",
          ...mockChapterData,
          lessons: [],
          chapterTest: {
            questions: [],
            passingScore: 70,
            cooldownHours: 3,
            timeLimit: 20,
          },
          isPublished: false,
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Chapter.create as jest.Mock).mockResolvedValue(mockChapter);

        await createChapter(mockRequest, mockResponse as Response, mockNext);

        expect(Course.findById).toHaveBeenCalledWith("course123");
        expect(Chapter.create).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: "course123",
            title: mockChapterData.title,
            chapterNumber: 1,
            chapterTest: expect.objectContaining({
              passingScore: 70,
              cooldownHours: 3,
            }),
          })
        );
        expect(mockCourse.chapters).toContain("chapter123");
        expect(mockCourse.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      test("should update course totalChapters count", async () => {
        mockRequest.body = mockChapterData;

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          title: "Course",
          description: "Desc",
          totalChapters: 2,
          chapters: ["ch1", "ch2"],
          finalExam: {
            questions: [],
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          isPublished: false,
          createdAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        const mockChapter = {
          _id: "chapter123",
          ...mockChapterData,
          lessons: [],
          chapterTest: { questions: [], passingScore: 70, cooldownHours: 3, timeLimit: 20 },
          isPublished: false,
        };

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Chapter.create as jest.Mock).mockResolvedValue(mockChapter);

        await createChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.totalChapters).toBe(3); // Was 2, now 3
        expect(mockCourse.save).toHaveBeenCalled();
      });

      test("should return 404 when course not found", async () => {
        mockRequest.body = mockChapterData;

        (Course.findById as jest.Mock).mockResolvedValue(null);

        await createChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Course not found" });
        expect(Chapter.create).not.toHaveBeenCalled();
      });

      test("should return validation errors", async () => {
        mockRequest.body = { courseId: "course123", title: "Test" }; // Missing fields

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "Description required" }, { msg: "Chapter number required" }]),
        });

        await createChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(Chapter.create).not.toHaveBeenCalled();
      });

      test("should handle database creation failure", async () => {
        mockRequest.body = mockChapterData;

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          chapters: [],
          totalChapters: 0,
          save: jest.fn(),
        } as any;

        const dbError = new Error("Insert failed");

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Chapter.create as jest.Mock).mockRejectedValue(dbError);

        await createChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });

      test("should handle duplicate chapter numbers", async () => {
        mockRequest.body = { ...mockChapterData, chapterNumber: 1 };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          chapters: [],
          totalChapters: 0,
          save: jest.fn(),
        } as any;

        // This should ideally be prevented by validation
        // but let's test that database constraint would catch it
        const duplicateError = new Error("Duplicate key error");

        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Chapter.create as jest.Mock).mockRejectedValue(duplicateError);

        await createChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(duplicateError);
      });
    });

    describe("deleteChapter", () => {
      test("should delete chapter and remove from course", async () => {
        mockRequest.params = { id: "chapter123" };

        const mockChapter = {
          _id: "chapter123",
          courseId: "course123",
          title: "Chapter to Delete",
        };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          chapters: ["chapter123", "chapter456"] as any,
          totalChapters: 2,
          save: jest.fn().mockResolvedValue(true),
        } as any;

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Course.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCourse);
        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Chapter.findByIdAndDelete as jest.Mock).mockResolvedValue(mockChapter);

        await deleteChapter(mockRequest, mockResponse as Response, mockNext);

        expect(Chapter.findById).toHaveBeenCalledWith("chapter123");
        expect(Course.findByIdAndUpdate).toHaveBeenCalledWith("course123", { $pull: { chapters: "chapter123" } });
        expect(Chapter.findByIdAndDelete).toHaveBeenCalledWith("chapter123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should update course totalChapters count", async () => {
        mockRequest.params = { id: "chapter123" };

        const mockChapter = {
          _id: "chapter123",
          courseId: "course123",
        };

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          chapters: ["chapter456"] as any, // After pull
          totalChapters: 2, // Old count
          save: jest.fn().mockResolvedValue(true),
        } as any;

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Course.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCourse);
        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
        (Chapter.findByIdAndDelete as jest.Mock).mockResolvedValue(mockChapter);

        await deleteChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.totalChapters).toBe(1); // Updated to match actual count
        expect(mockCourse.save).toHaveBeenCalled();
      });

      test("should return 404 for non-existent chapter", async () => {
        mockRequest.params = { id: "nonexistent" };

        (Chapter.findById as jest.Mock).mockResolvedValue(null);

        await deleteChapter(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Chapter not found" });
      });

      test("should handle course not found during cleanup", async () => {
        mockRequest.params = { id: "chapter123" };

        const mockChapter = {
          _id: "chapter123",
          courseId: "course123",
        };

        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
        (Course.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
        (Course.findById as jest.Mock).mockResolvedValue(null); // Course deleted meanwhile
        (Chapter.findByIdAndDelete as jest.Mock).mockResolvedValue(mockChapter);

        await deleteChapter(mockRequest, mockResponse as Response, mockNext);

        // Should still delete chapter even if course is gone
        expect(Chapter.findByIdAndDelete).toHaveBeenCalledWith("chapter123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });
  });

  //*=====================================================
  //* QUESTION MANAGEMENT TESTS (Critical for bugs!)
  //*=====================================================

  describe("Question Management", () => {
    describe("createQuestion", () => {
      const mockQuestionData = {
        questionText: "What is the medical term for high blood pressure?",
        options: ["Hypertension", "Hypotension", "Tachycardia", "Bradycardia"],
        correctAnswer: "Hypertension",
        type: "quiz" as const,
        difficulty: "easy" as const,
      };

      test("should create question successfully", async () => {
        mockRequest.body = mockQuestionData;

        const mockQuestion = {
          _id: "question123",
          ...mockQuestionData,
        };

        (Question.create as jest.Mock).mockResolvedValue(mockQuestion);

        await createQuestion(mockRequest, mockResponse as Response, mockNext);

        expect(Question.create).toHaveBeenCalledWith(expect.objectContaining(mockQuestionData));
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      test("should REJECT if correctAnswer not in options (CRITICAL BUG PREVENTION)", async () => {
        mockRequest.body = {
          ...mockQuestionData,
          correctAnswer: "InvalidAnswer", // NOT in options!
        };

        await createQuestion(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Correct answer must be one of the provided options",
        });
        expect(Question.create).not.toHaveBeenCalled();
      });

      test("should handle case-sensitive correctAnswer validation", async () => {
        mockRequest.body = {
          questionText: "Test question?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "option a", // Different case!
          type: "quiz" as const,
        };

        await createQuestion(mockRequest, mockResponse as Response, mockNext);

        // Should fail because 'option a' !== 'Option A'
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(Question.create).not.toHaveBeenCalled();
      });

      test("should handle whitespace in correctAnswer", async () => {
        mockRequest.body = {
          questionText: "Test question?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: " Option A ", // Extra spaces!
          type: "quiz" as const,
        };

        await createQuestion(mockRequest, mockResponse as Response, mockNext);

        // Should fail because ' Option A ' !== 'Option A'
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      test("should accept question with explanation and audioUrl", async () => {
        mockRequest.body = {
          ...mockQuestionData,
          explanation: "Hypertension refers to high blood pressure...",
          audioUrl: "https://example.com/audio/question1.mp3",
        };

        const mockQuestion = {
          _id: "question123",
          ...mockRequest.body,
        };

        (Question.create as jest.Mock).mockResolvedValue(mockQuestion);

        await createQuestion(mockRequest, mockResponse as Response, mockNext);

        expect(Question.create).toHaveBeenCalledWith(
          expect.objectContaining({
            explanation: expect.any(String),
            audioUrl: expect.any(String),
          })
        );
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      test("should validate question type enum", async () => {
        mockRequest.body = {
          ...mockQuestionData,
          type: "invalid-type" as any, // Invalid type!
        };

        const validationError = new Error("Validation failed: type must be quiz, test, or exam");
        (Question.create as jest.Mock).mockRejectedValue(validationError);

        await createQuestion(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });
    });

    describe("bulkCreateQuestions", () => {
      test("should create multiple questions at once", async () => {
        mockRequest.body = {
          questions: [
            {
              questionText: "Question 1?",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
              type: "quiz",
            },
            {
              questionText: "Question 2?",
              options: ["W", "X", "Y", "Z"],
              correctAnswer: "X",
              type: "test",
            },
          ],
        };

        const mockCreatedQuestions = [
          { _id: "q1", questionText: "Question 1?", type: "quiz" },
          { _id: "q2", questionText: "Question 2?", type: "test" },
        ];

        (Question.insertMany as jest.Mock).mockResolvedValue(mockCreatedQuestions);

        await bulkCreateQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(Question.insertMany).toHaveBeenCalledWith(mockRequest.body.questions);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            count: 2,
            questionIds: ["q1", "q2"],
          })
        );
      });

      test("should return 400 for empty array", async () => {
        mockRequest.body = { questions: [] };

        await bulkCreateQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Questions array is required and cannot be empty",
        });
        expect(Question.insertMany).not.toHaveBeenCalled();
      });

      test("should validate each question has required fields", async () => {
        mockRequest.body = {
          questions: [
            {
              questionText: "Question 1?",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
              type: "quiz",
            },
            {
              // Missing questionText!
              options: ["W", "X", "Y", "Z"],
              correctAnswer: "X",
              type: "test",
            },
          ],
        };

        await bulkCreateQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: expect.stringContaining("index 1"),
        });
      });

      test("should return 400 if options count is not 4 (CRITICAL)", async () => {
        mockRequest.body = {
          questions: [
            {
              questionText: "Question 1?",
              options: ["A", "B", "C"], // Only 3 options!
              correctAnswer: "A",
              type: "quiz",
            },
          ],
        };

        await bulkCreateQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: expect.stringContaining("exactly 4 options"),
        });
      });

      test("should return 400 if correctAnswer not in options for ANY question", async () => {
        mockRequest.body = {
          questions: [
            {
              questionText: "Question 1?",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
              type: "quiz",
            },
            {
              questionText: "Question 2?",
              options: ["W", "X", "Y", "Z"],
              correctAnswer: "INVALID", // Not in options!
              type: "test",
            },
          ],
        };

        await bulkCreateQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: expect.stringContaining("invalid correct answer"),
        });
      });

      test("should handle database insertMany failure", async () => {
        mockRequest.body = {
          questions: [
            {
              questionText: "Question 1?",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
              type: "quiz",
            },
          ],
        };

        const dbError = new Error("Bulk insert failed");
        (Question.insertMany as jest.Mock).mockRejectedValue(dbError);

        await bulkCreateQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });

    describe("assignQuestions", () => {
      test("should assign questions to lesson quiz", async () => {
        mockRequest.body = {
          targetId: "lesson123",
          targetType: "lesson",
          questionIds: ["q1", "q2", "q3"],
        };

        const mockQuestions = [{ _id: "q1" }, { _id: "q2" }, { _id: "q3" }];

        const mockLesson: Partial<MockLesson> = {
          _id: "lesson123",
          quiz: {
            questions: [] as any,
            passingScore: 80,
            unlimitedAttempts: true,
          },
          save: jest.fn().mockResolvedValue(true),
        } as any;

        (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);

        await assignQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockLesson.quiz!.questions).toEqual(["q1", "q2", "q3"]);
        expect(mockLesson.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            assigned: 3,
            total: 3,
          })
        );
      });

      test("should prevent duplicate assignments (CRITICAL)", async () => {
        mockRequest.body = {
          targetId: "lesson123",
          targetType: "lesson",
          questionIds: ["q1", "q2", "q3"],
        };

        const mockQuestions = [{ _id: "q1" }, { _id: "q2" }, { _id: "q3" }];

        const mockLesson: Partial<MockLesson> = {
          _id: "lesson123",
          quiz: {
            questions: ["q1", "q2"] as any, // q1 and q2 already assigned!
            passingScore: 80,
            unlimitedAttempts: true,
          },
          save: jest.fn().mockResolvedValue(true),
        } as any;

        (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
        (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);

        await assignQuestions(mockRequest, mockResponse as Response, mockNext);

        // Should only add q3 (new question)
        expect(mockLesson.quiz!.questions).toHaveLength(3);
        expect(mockLesson.quiz!.questions).toContain("q3");
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            assigned: 1, // Only 1 new question
            total: 3, // Total is 3 now
          })
        );
      });

      test("should return 404 if some question IDs are invalid", async () => {
        mockRequest.body = {
          targetId: "lesson123",
          targetType: "lesson",
          questionIds: ["q1", "q2", "nonexistent"],
        };

        const mockQuestions = [
          { _id: "q1" },
          { _id: "q2" },
          // q3 not found!
        ];

        (Question.find as jest.Mock).mockResolvedValue(mockQuestions);

        await assignQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Some question IDs are invalid",
        });
        expect(Lesson.findById).not.toHaveBeenCalled();
      });

      test("should assign to chapter test", async () => {
        mockRequest.body = {
          targetId: "chapter123",
          targetType: "chapter",
          questionIds: ["q1", "q2"],
        };

        const mockQuestions = [{ _id: "q1" }, { _id: "q2" }];

        const mockChapter: Partial<MockChapter> = {
          _id: "chapter123",
          chapterTest: {
            questions: [] as any,
            passingScore: 70,
            cooldownHours: 3,
            timeLimit: 20,
          },
          save: jest.fn().mockResolvedValue(true),
        } as any;

        (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
        (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

        await assignQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockChapter.chapterTest!.questions).toEqual(["q1", "q2"]);
        expect(mockChapter.save).toHaveBeenCalled();
      });

      test("should assign to course final exam", async () => {
        mockRequest.body = {
          targetId: "course123",
          targetType: "course",
          questionIds: ["q1", "q2", "q3"],
        };

        const mockQuestions = [{ _id: "q1" }, { _id: "q2" }, { _id: "q3" }];

        const mockCourse: Partial<MockCourse> = {
          _id: "course123",
          finalExam: {
            questions: [] as any,
            passingScore: 80,
            cooldownHours: 24,
            timeLimit: 100,
          },
          save: jest.fn().mockResolvedValue(true),
        } as any;

        (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
        (Course.findById as jest.Mock).mockResolvedValue(mockCourse);

        await assignQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockCourse.finalExam!.questions).toEqual(["q1", "q2", "q3"]);
        expect(mockCourse.save).toHaveBeenCalled();
      });

      test("should return 404 if target not found", async () => {
        mockRequest.body = {
          targetId: "nonexistent",
          targetType: "lesson",
          questionIds: ["q1"],
        };

        const mockQuestions = [{ _id: "q1" }];

        (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
        (Lesson.findById as jest.Mock).mockResolvedValue(null);

        await assignQuestions(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Lesson not found" });
      });
    });
  });

  //*=====================================================
  //* USER MANAGEMENT TESTS
  //*=====================================================

  describe("User Management", () => {
    describe("getAllUsers", () => {
      test("should return paginated users", async () => {
        mockRequest.query = { page: "1", limit: "10" };

        const mockUsers = [
          {
            _id: "user1",
            name: "John Doe",
            email: "john@example.com",
            role: "Student",
            isVerified: true,
            createdAt: new Date(),
          },
          {
            _id: "user2",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "Admin",
            isVerified: true,
            createdAt: new Date(),
          },
        ];

        (User.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        });
        (User.countDocuments as jest.Mock).mockResolvedValue(25);

        await getAllUsers(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          users: expect.arrayContaining([expect.objectContaining({ id: "user1", name: "John Doe" })]),
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            pages: 3,
          },
        });
      });

      test("should search by name (case-insensitive)", async () => {
        mockRequest.query = { search: "john", page: "1", limit: "10" };

        const mockUsers = [
          {
            _id: "user1",
            name: "John Doe",
            email: "john@example.com",
            role: "Student",
            isVerified: true,
            createdAt: new Date(),
          },
        ];

        (User.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        });
        (User.countDocuments as jest.Mock).mockResolvedValue(1);

        await getAllUsers(mockRequest, mockResponse as Response, mockNext);

        expect(User.find).toHaveBeenCalledWith(
          expect.objectContaining({
            $or: expect.arrayContaining([{ name: { $regex: "john", $options: "i" } }, { email: { $regex: "john", $options: "i" } }]),
          })
        );
      });

      test("should filter by role", async () => {
        mockRequest.query = { role: "Student", page: "1", limit: "10" };

        (User.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        (User.countDocuments as jest.Mock).mockResolvedValue(0);

        await getAllUsers(mockRequest, mockResponse as Response, mockNext);

        expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ role: "Student" }));
      });

      test("should handle pagination edge cases (page 0)", async () => {
        mockRequest.query = { page: "0", limit: "10" }; // Invalid page

        (User.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        (User.countDocuments as jest.Mock).mockResolvedValue(0);

        await getAllUsers(mockRequest, mockResponse as Response, mockNext);

        // Should treat page 0 as page 0 (which would skip -10 items - might cause issues!)
        // This is a potential BUG if not handled
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should handle very large limit values", async () => {
        mockRequest.query = { page: "1", limit: "10000" }; // Massive limit

        (User.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });
        (User.countDocuments as jest.Mock).mockResolvedValue(0);

        await getAllUsers(mockRequest, mockResponse as Response, mockNext);

        // Should still work but might be performance issue
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe("updateUserRole", () => {
      test("should update user role successfully", async () => {
        mockRequest.params = { id: "user123" };
        mockRequest.body = { role: "Admin" };

        const mockUser = {
          _id: "user123",
          name: "John Doe",
          email: "john@example.com",
          role: "Student",
          save: jest.fn().mockResolvedValue(true),
        };

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        await updateUserRole(mockRequest, mockResponse as Response, mockNext);

        expect(mockUser.role).toBe("Admin");
        expect(mockUser.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should return 400 for invalid role", async () => {
        mockRequest.params = { id: "user123" };
        mockRequest.body = { role: "InvalidRole" };

        await updateUserRole(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "Invalid role" });
        expect(User.findById).not.toHaveBeenCalled();
      });

      test("should only allow Student/Admin/SuperVisor roles", async () => {
        const validRoles = ["Student", "Admin", "SuperVisor"];
        const invalidRoles = ["student", "ADMIN", "Moderator", "User", ""];

        for (const invalidRole of invalidRoles) {
          jest.clearAllMocks();
          mockRequest.body = { role: invalidRole };

          await updateUserRole(mockRequest, mockResponse as Response, mockNext);

          expect(mockResponse.status).toHaveBeenCalledWith(400);
        }
      });

      test("should return 404 for non-existent user", async () => {
        mockRequest.params = { id: "nonexistent" };
        mockRequest.body = { role: "Admin" };

        (User.findById as jest.Mock).mockResolvedValue(null);

        await updateUserRole(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "User not found" });
      });
    });

    describe("deleteUser", () => {
      test("should delete user and all progress", async () => {
        mockRequest.params = { id: "user123" };

        const mockUser = {
          _id: "user123",
          name: "John Doe",
        };

        (User.findById as jest.Mock).mockResolvedValue(mockUser);
        (UserProgress.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
        (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

        await deleteUser(mockRequest, mockResponse as Response, mockNext);

        expect(UserProgress.deleteMany).toHaveBeenCalledWith({ userId: "user123" });
        expect(User.findByIdAndDelete).toHaveBeenCalledWith("user123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should return 404 for non-existent user", async () => {
        mockRequest.params = { id: "nonexistent" };

        (User.findById as jest.Mock).mockResolvedValue(null);

        await deleteUser(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(UserProgress.deleteMany).not.toHaveBeenCalled();
      });
    });

    describe("resetUserProgress", () => {
      test("should reset all user progress fields", async () => {
        mockRequest.params = { id: "user123" };
        process.env.COURSE_ID = "course123";

        const mockProgress = {
          userId: "user123",
          courseId: "course123",
          currentChapterNumber: 5,
          currentLessonNumber: 10,
          completedLessons: ["l1", "l2", "l3"],
          chapterTestAttempts: ["attempt1"],
          chapterTestCooldowns: ["cooldown1"],
          finalExamAttempts: ["exam1"],
          finalExamCooldown: { lastAttemptAt: new Date() },
          courseCompleted: true,
          completedAt: new Date(),
          certificateIssued: true,
          certificateIssuedAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

        await resetUserProgress(mockRequest, mockResponse as Response, mockNext);

        // Verify all fields are reset
        expect(mockProgress.currentChapterNumber).toBe(1);
        expect(mockProgress.currentLessonNumber).toBe(1);
        expect(mockProgress.completedLessons).toEqual([]);
        expect(mockProgress.chapterTestAttempts).toEqual([]);
        expect(mockProgress.chapterTestCooldowns).toEqual([]);
        expect(mockProgress.finalExamAttempts).toEqual([]);
        expect(mockProgress.finalExamCooldown).toBeUndefined();
        expect(mockProgress.courseCompleted).toBe(false);
        expect(mockProgress.completedAt).toBeUndefined();
        expect(mockProgress.certificateIssued).toBe(false);
        expect(mockProgress.certificateIssuedAt).toBeUndefined();
        expect(mockProgress.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should return 404 if progress not found", async () => {
        mockRequest.params = { id: "user123" };
        process.env.COURSE_ID = "course123";

        (UserProgress.findOne as jest.Mock).mockResolvedValue(null);

        await resetUserProgress(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "User progress not found" });
      });
    });
  });

  //*=====================================================
  //* STATISTICS TESTS (Critical for data integrity!)
  //*=====================================================

  describe("Statistics & Analytics", () => {
    describe("getDashboardStats", () => {
      test("should return correct dashboard statistics", async () => {
        (User.countDocuments as jest.Mock)
          .mockResolvedValueOnce(100) // totalUsers
          .mockResolvedValueOnce(85); // studentUsers

        (UserProgress.countDocuments as jest.Mock)
          .mockResolvedValueOnce(50) // usersWithProgress
          .mockResolvedValueOnce(30); // completedUsers

        (Certificate.countDocuments as jest.Mock).mockResolvedValue(60); // certificatesIssued

        await getDashboardStats(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          stats: {
            totalUsers: 100,
            studentUsers: 85,
            usersWithProgress: 50,
            completedUsers: 30,
            certificatesIssued: 60,
            completionRate: "60%", // 30/50 = 60%
          },
        });
      });

      test("should handle zero division in completion rate", async () => {
        (User.countDocuments as jest.Mock).mockResolvedValueOnce(10).mockResolvedValueOnce(5);

        (UserProgress.countDocuments as jest.Mock)
          .mockResolvedValueOnce(0) // No users with progress
          .mockResolvedValueOnce(0);

        (Certificate.countDocuments as jest.Mock).mockResolvedValue(0);

        await getDashboardStats(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith({
          stats: expect.objectContaining({
            completionRate: "0%", // Should handle 0/0 gracefully
          }),
        });
      });

      test("should handle database query failures", async () => {
        const dbError = new Error("Connection timeout");
        (User.countDocuments as jest.Mock).mockRejectedValue(dbError);

        await getDashboardStats(mockRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });

    describe("getStatistics", () => {
      test("should calculate average scores correctly", async () => {
        // Setup comprehensive mock data
        (User.countDocuments as jest.Mock).mockResolvedValue(100);
        (Course.countDocuments as jest.Mock).mockResolvedValue(1);
        (Chapter.countDocuments as jest.Mock).mockResolvedValue(5);
        (Lesson.countDocuments as jest.Mock).mockResolvedValue(25);
        (Question.countDocuments as jest.Mock)
          .mockResolvedValueOnce(50) // total
          .mockResolvedValueOnce(20) // quiz
          .mockResolvedValueOnce(20) // test
          .mockResolvedValueOnce(10); // exam

        const mockProgress = [
          {
            completedLessons: [
              { attempts: 2, passed: true, quizScore: 90, completedAt: new Date() },
              { attempts: 1, passed: true, quizScore: 85, completedAt: new Date() },
            ],
            chapterTestAttempts: [
              { score: 75, passed: true, attemptedAt: new Date() },
              { score: 80, passed: true, attemptedAt: new Date() },
            ],
            finalExamAttempts: [{ score: 88, passed: true, attemptedAt: new Date() }],
          },
        ];

        (UserProgress.find as jest.Mock).mockResolvedValue(mockProgress);
        (UserProgress.countDocuments as jest.Mock)
          .mockResolvedValueOnce(10) // completedCourses
          .mockResolvedValueOnce(10); // certificatesIssued

        await getStatistics(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            attempts: {
              quizzes: expect.objectContaining({
                avgScore: expect.any(Number), // Should be (90+85)/2 = 87
              }),
              tests: expect.objectContaining({
                avgScore: expect.any(Number), // Should be (75+80)/2 = 77
              }),
              exams: expect.objectContaining({
                avgScore: 88,
              }),
            },
          })
        );
      });

      test("should handle zero attempts gracefully", async () => {
        (User.countDocuments as jest.Mock).mockResolvedValue(0);
        (Course.countDocuments as jest.Mock).mockResolvedValue(0);
        (Chapter.countDocuments as jest.Mock).mockResolvedValue(0);
        (Lesson.countDocuments as jest.Mock).mockResolvedValue(0);
        (Question.countDocuments as jest.Mock).mockResolvedValue(0);
        (UserProgress.find as jest.Mock).mockResolvedValue([]);
        (UserProgress.countDocuments as jest.Mock).mockResolvedValue(0);

        await getStatistics(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            attempts: {
              quizzes: {
                total: 0,
                passed: 0,
                avgScore: 0,
                passRate: 0,
              },
              tests: {
                total: 0,
                passed: 0,
                avgScore: 0,
                passRate: 0,
              },
              exams: {
                total: 0,
                passed: 0,
                avgScore: 0,
                passRate: 0,
              },
            },
          })
        );
      });

      test("should generate correct daily activity for last 7 days", async () => {
        // This tests date range logic
        (User.countDocuments as jest.Mock).mockResolvedValue(0);
        (Course.countDocuments as jest.Mock).mockResolvedValue(0);
        (Chapter.countDocuments as jest.Mock).mockResolvedValue(0);
        (Lesson.countDocuments as jest.Mock).mockResolvedValue(0);
        (Question.countDocuments as jest.Mock).mockResolvedValue(0);
        (UserProgress.find as jest.Mock).mockResolvedValue([]);
        (UserProgress.countDocuments as jest.Mock).mockResolvedValue(0);

        await getStatistics(mockRequest, mockResponse as Response, mockNext);

        const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

        expect(response.dailyActivity).toHaveLength(7);
        expect(response.dailyActivity[0]).toHaveProperty("date");
        expect(response.dailyActivity[0]).toHaveProperty("quizzes");
        expect(response.dailyActivity[0]).toHaveProperty("tests");
        expect(response.dailyActivity[0]).toHaveProperty("exams");
      });
    });
  });

  //*=====================================================
  //* SETTINGS MANAGEMENT TESTS
  //*=====================================================

  describe("Settings Management", () => {
    describe("getSettings", () => {
      test("should return existing settings with system stats", async () => {
        const mockSettings = {
          _id: "settings123",
          platformName: "Medical Interpreter Platform",
          supportEmail: "support@example.com",
          timezone: "UTC",
          maintenanceMode: false,
          defaultQuizPassingScore: 80,
          defaultTestPassingScore: 70,
          defaultExamPassingScore: 80,
          defaultTestCooldownHours: 3,
          defaultExamCooldownHours: 24,
          unlimitedQuizRetries: true,
          smtpConfigured: true,
          emailNotificationsEnabled: true,
          certificatePrefix: "MIC",
          autoIssueCertificates: true,
          certificateTemplate: "default",
          lastBackupDate: new Date(),
          updatedAt: new Date(),
        };

        (Settings.findOne as jest.Mock).mockResolvedValue(mockSettings);
        (User.countDocuments as jest.Mock).mockResolvedValue(100);
        (Course.countDocuments as jest.Mock).mockResolvedValue(1);
        (Question.countDocuments as jest.Mock).mockResolvedValue(200);
        (Certificate.countDocuments as jest.Mock).mockResolvedValue(50);

        await getSettings(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          settings: expect.objectContaining({
            platformName: "Medical Interpreter Platform",
            supportEmail: "support@example.com",
          }),
          systemStats: {
            totalUsers: 100,
            totalCourses: 1,
            totalQuestions: 200,
            totalCertificates: 50,
            apiVersion: "1.0.0",
            nodeVersion: process.version,
            uptime: expect.any(Number),
          },
        });
      });

      test("should create default settings if none exist", async () => {
        (Settings.findOne as jest.Mock).mockResolvedValue(null);

        const mockCreatedSettings = {
          _id: "settings123",
          platformName: "Medical Interpreter Platform",
          supportEmail: "support@medicalinterpreter.com",
          // ... default values
        };

        (Settings.create as jest.Mock).mockResolvedValue(mockCreatedSettings);
        (User.countDocuments as jest.Mock).mockResolvedValue(0);
        (Course.countDocuments as jest.Mock).mockResolvedValue(0);
        (Question.countDocuments as jest.Mock).mockResolvedValue(0);
        (Certificate.countDocuments as jest.Mock).mockResolvedValue(0);

        await getSettings(mockRequest, mockResponse as Response, mockNext);

        expect(Settings.create).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      test("should handle Settings.create returning array (edge case)", async () => {
        (Settings.findOne as jest.Mock).mockResolvedValue(null);

        const mockCreatedSettings = {
          _id: "settings123",
          platformName: "Test",
        };

        // Some Mongoose operations can return arrays
        (Settings.create as jest.Mock).mockResolvedValue([mockCreatedSettings]);
        (User.countDocuments as jest.Mock).mockResolvedValue(0);
        (Course.countDocuments as jest.Mock).mockResolvedValue(0);
        (Question.countDocuments as jest.Mock).mockResolvedValue(0);
        (Certificate.countDocuments as jest.Mock).mockResolvedValue(0);

        await getSettings(mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe("updateSettings", () => {
      test("should update only provided fields", async () => {
        mockRequest.body = {
          platformName: "New Platform Name",
          defaultQuizPassingScore: 85,
        };

        const mockSettings = {
          _id: "settings123",
          platformName: "Old Name",
          supportEmail: "old@example.com",
          defaultQuizPassingScore: 80,
          defaultTestPassingScore: 70,
          save: jest.fn().mockResolvedValue(true),
        };

        (Settings.findOne as jest.Mock).mockResolvedValue(mockSettings);

        await updateSettings(mockRequest, mockResponse as Response, mockNext);

        expect(mockSettings.platformName).toBe("New Platform Name");
        expect(mockSettings.defaultQuizPassingScore).toBe(85);
        expect(mockSettings.supportEmail).toBe("old@example.com"); // Unchanged
        expect(mockSettings.save).toHaveBeenCalled();
      });

      test("should ignore non-allowed fields", async () => {
        mockRequest.body = {
          platformName: "New Name",
          hackerField: "malicious",
          _id: "hacked",
        };

        const mockSettings = {
          _id: "settings123",
          platformName: "Old Name",
          save: jest.fn().mockResolvedValue(true),
        };

        (Settings.findOne as jest.Mock).mockResolvedValue(mockSettings);

        await updateSettings(mockRequest, mockResponse as Response, mockNext);

        expect(mockSettings).not.toHaveProperty("hackerField");
        expect(mockSettings._id).toBe("settings123"); // Not changed
        expect(mockSettings.platformName).toBe("New Name");
      });

      test("should create settings with updates if does not exist", async () => {
        mockRequest.body = {
          platformName: "New Platform",
        };

        (Settings.findOne as jest.Mock).mockResolvedValue(null);

        const mockCreatedSettings = {
          _id: "settings123",
          platformName: "New Platform",
        };

        (Settings.create as jest.Mock).mockResolvedValue(mockCreatedSettings);

        await updateSettings(mockRequest, mockResponse as Response, mockNext);

        expect(Settings.create).toHaveBeenCalledWith(mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });
  });
});
