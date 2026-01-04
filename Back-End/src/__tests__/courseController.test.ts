import { Request, Response, NextFunction } from "express";
import { getCourse, getChapter, getLesson, getLessonQuiz, submitLessonQuiz, getUserProgress, getChapterTest, submitChapterTest, getFinalExam, submitFinalExam, getUserCertificate, verifyCertificate, getDetailedProgress, getUserCertificates, startChapterTest, abandonChapterTest } from "../controllers/courseController";

import Course from "../models/Course";
import Chapter from "../models/Chapter";
import Lesson from "../models/Lesson";
import Question from "../models/Question";
import UserProgress from "../models/UserProgress";
import Certificate from "../models/Certificate";
import User from "../models/User";
import TestSession from "../models/TestSession";
import { generateCertificate } from "../services/certificateGenerator";
import { generateCertificateNumber, generateVerificationCode } from "../utils/certificateGenerator";
import { sendCertificateEmail } from "../utils/emailService";

// Mock all dependencies
jest.mock("../models/Course");
jest.mock("../models/Chapter");
jest.mock("../models/Lesson");
jest.mock("../models/Question");
jest.mock("../models/UserProgress");
jest.mock("../models/Certificate");
jest.mock("../models/User");
jest.mock("../models/TestSession");
jest.mock("../services/certificateGenerator");
jest.mock("../utils/certificateGenerator");
jest.mock("../utils/emailService");

describe("Progress Controller - Student Learning Journey Tests", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      query: {},
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
  //* COURSE & CONTENT RETRIEVAL TESTS
  //*=====================================================

  describe("getCourse", () => {
    test("should return course with published chapters and lessons", async () => {
      mockRequest.params = { id: "course123" };

      const mockCourse = {
        _id: "course123",
        title: "Medical Interpreter Course",
        description: "Complete medical interpreter training",
        chapters: [
          {
            _id: "chapter1",
            title: "Introduction",
            description: "Getting started",
            chapterNumber: 1,
            isPublished: true,
            lessons: [
              { _id: "lesson1", title: "Lesson 1", lessonNumber: 1, isPublished: true },
              { _id: "lesson2", title: "Lesson 2", lessonNumber: 2, isPublished: true },
            ],
          },
        ],
      };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getCourse(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        course: {
          id: "course123",
          title: "Medical Interpreter Course",
          description: "Complete medical interpreter training",
          totalChapters: 1,
          chapters: expect.arrayContaining([
            expect.objectContaining({
              _id: "chapter1",
              title: "Introduction",
              chapterNumber: 1,
            }),
          ]),
        },
      });
    });

    test("should return 404 for non-existent course", async () => {
      mockRequest.params = { id: "nonexistent" };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getCourse(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Course not found" });
    });

    test("should filter unpublished chapters", async () => {
      mockRequest.params = { id: "course123" };

      const mockCourse = {
        _id: "course123",
        title: "Course",
        description: "Description",
        chapters: [
          {
            _id: "chapter1",
            title: "Published Chapter",
            chapterNumber: 1,
            isPublished: true,
            lessons: [],
          },
        ],
      };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getCourse(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.objectContaining({
            totalChapters: 1,
          }),
        })
      );
    });

    test("should handle database errors", async () => {
      mockRequest.params = { id: "course123" };

      const dbError = new Error("Database error");
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(dbError),
      });

      await getCourse(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("getChapter", () => {
    test("should return chapter with published lessons and test info", async () => {
      mockRequest.params = { id: "chapter123" };

      const mockChapter = {
        _id: "chapter123",
        title: "Medical Terminology",
        description: "Learn medical terms",
        chapterNumber: 1,
        lessons: [
          { _id: "lesson1", title: "Lesson 1", lessonNumber: 1, isPublished: true },
          { _id: "lesson2", title: "Lesson 2", lessonNumber: 2, isPublished: false },
        ],
        chapterTest: {
          questions: ["q1", "q2", "q3"],
          passingScore: 70,
          timeLimit: 30,
          cooldownHours: 3,
        },
      };

      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });

      await getChapter(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        chapter: expect.objectContaining({
          id: "chapter123",
          title: "Medical Terminology",
          totalLessons: 1, // Only published
          chapterTest: {
            totalQuestions: 3,
            passingScore: 70,
            timeLimit: 30,
            cooldownHours: 3,
          },
        }),
      });
    });

    test("should return 404 for non-existent chapter", async () => {
      mockRequest.params = { id: "nonexistent" };

      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getChapter(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Chapter not found" });
    });

    test("should filter unpublished lessons", async () => {
      mockRequest.params = { id: "chapter123" };

      const mockChapter = {
        _id: "chapter123",
        title: "Chapter",
        description: "Description",
        chapterNumber: 1,
        lessons: [
          { _id: "lesson1", isPublished: true },
          { _id: "lesson2", isPublished: false },
          { _id: "lesson3", isPublished: true },
        ],
        chapterTest: { questions: [], passingScore: 70, timeLimit: 30, cooldownHours: 3 },
      };

      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });

      await getChapter(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.chapter.totalLessons).toBe(2);
    });
  });

  describe("getLesson", () => {
    test("should return lesson with chapter context", async () => {
      mockRequest.params = { id: "lesson123" };

      const mockLesson = {
        _id: "lesson123",
        title: "Introduction to Medical Terms",
        lessonNumber: 1,
        content: "<p>Lesson content here</p>",
        contentType: "text",
        audioUrl: null,
        isPublished: true,
        chapterId: {
          _id: "chapter123",
          title: "Medical Terminology",
          chapterNumber: 1,
        },
      };

      const mockChapterLessons = [
        { _id: "lesson123", title: "Lesson 1", lessonNumber: 1 },
        { _id: "lesson124", title: "Lesson 2", lessonNumber: 2 },
      ];

      (Lesson.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLesson),
      });

      (Lesson.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockChapterLessons),
      });

      await getLesson(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        lesson: {
          id: "lesson123",
          title: "Introduction to Medical Terms",
          lessonNumber: 1,
          content: "<p>Lesson content here</p>",
          contentType: "text",
          audioUrl: null,
        },
        chapter: {
          id: "chapter123",
          title: "Medical Terminology",
          chapterNumber: 1,
          lessons: mockChapterLessons,
        },
      });
    });

    test("should return 404 for non-existent lesson", async () => {
      mockRequest.params = { id: "nonexistent" };

      (Lesson.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getLesson(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Lesson not found" });
    });

    test("should return 403 for unpublished lesson", async () => {
      mockRequest.params = { id: "lesson123" };

      const mockLesson = {
        _id: "lesson123",
        title: "Unpublished Lesson",
        isPublished: false,
        chapterId: { _id: "chapter123" },
      };

      (Lesson.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLesson),
      });

      await getLesson(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "This lesson is not published yet",
      });
    });
  });

  //*=====================================================
  //* LESSON QUIZ TESTS
  //*=====================================================

  describe("getLessonQuiz", () => {
    test("should return randomized quiz questions", async () => {
      mockRequest.params = { id: "lesson123" };

      const mockLesson = {
        _id: "lesson123",
        title: "Medical Terms",
        isPublished: true,
        quiz: {
          questions: ["q1", "q2", "q3"],
          passingScore: 70,
          unlimitedAttempts: true,
        },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "What is triage?",
          options: ["A", "B", "C", "D"],
          type: "multiple-choice",
          difficulty: "medium",
        },
        {
          _id: "q2",
          questionText: "What is HIPAA?",
          options: ["A", "B", "C", "D"],
          type: "multiple-choice",
          difficulty: "easy",
        },
      ];

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });

      await getLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        quiz: expect.objectContaining({
          lessonId: "lesson123",
          lessonTitle: "Medical Terms",
          totalQuestions: 2,
          passingScore: 70,
          unlimitedAttempts: true,
          questions: expect.arrayContaining([
            expect.objectContaining({
              _id: expect.any(String),
              questionText: expect.any(String),
              options: expect.any(Array),
            }),
          ]),
        }),
      });
    });

    test("should return 404 for non-existent lesson", async () => {
      mockRequest.params = { id: "nonexistent" };

      (Lesson.findById as jest.Mock).mockResolvedValue(null);

      await getLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Lesson not found" });
    });

    test("should return 403 for unpublished lesson", async () => {
      mockRequest.params = { id: "lesson123" };

      const mockLesson = {
        _id: "lesson123",
        isPublished: false,
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);

      await getLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    test("should exclude correct answers from questions", async () => {
      mockRequest.params = { id: "lesson123" };

      const mockLesson = {
        _id: "lesson123",
        isPublished: true,
        quiz: { questions: ["q1"], passingScore: 70, unlimitedAttempts: true },
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            _id: "q1",
            questionText: "Question?",
            options: ["A", "B", "C", "D"],
            type: "multiple-choice",
            difficulty: "easy",
          },
        ]),
      });

      await getLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(Question.find).toHaveBeenCalled();
      expect((Question.find as jest.Mock)().select).toHaveBeenCalledWith("-correctAnswer -explanation");
    });
  });

  describe("submitLessonQuiz", () => {
    test("should calculate score and return results", async () => {
      mockRequest.params = { id: "lesson123" };
      mockRequest.body = {
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q2", selectedAnswer: "B" },
        ],
      };
      mockRequest.user = { userId: "user123" };

      const mockLesson = {
        _id: "lesson123",
        chapterId: "chapter123",
        quiz: { questions: ["q1", "q2"], passingScore: 70 },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Question 1",
          correctAnswer: "A",
          explanation: "Explanation 1",
        },
        {
          _id: "q2",
          questionText: "Question 2",
          correctAnswer: "C",
          explanation: "Explanation 2",
        },
      ];

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        lessons: [{ _id: "lesson123" }],
      };

      const mockProgress = {
        completedLessons: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 50, // 1 correct out of 2
          correctCount: 1,
          totalQuestions: 2,
          passed: false,
          passingScore: 70,
          results: expect.arrayContaining([
            expect.objectContaining({
              questionId: "q1",
              isCorrect: true,
            }),
            expect.objectContaining({
              questionId: "q2",
              isCorrect: false,
            }),
          ]),
        })
      );
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { id: "lesson123" };
      mockRequest.body = { answers: [] };
      mockRequest.user = undefined;

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    test("should return 404 for non-existent lesson", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.body = { answers: [] };
      mockRequest.user = { userId: "user123" };

      (Lesson.findById as jest.Mock).mockResolvedValue(null);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should return 400 if no quiz questions found", async () => {
      mockRequest.params = { id: "lesson123" };
      mockRequest.body = { answers: [] };
      mockRequest.user = { userId: "user123" };

      const mockLesson = {
        _id: "lesson123",
        quiz: { questions: ["q1"], passingScore: 70 },
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockResolvedValue([]);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No quiz questions found for this lesson",
      });
    });

    test("should update progress for first-time completion", async () => {
      mockRequest.params = { id: "lesson123" };
      mockRequest.body = {
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q2", selectedAnswer: "B" },
        ],
      };
      mockRequest.user = { userId: "user123" };

      const mockLesson = {
        _id: "lesson123",
        chapterId: "chapter123",
        quiz: { questions: ["q1", "q2"], passingScore: 70 },
      };

      const mockQuestions = [
        { _id: "q1", correctAnswer: "A", questionText: "Q1", explanation: "E1" },
        { _id: "q2", correctAnswer: "B", questionText: "Q2", explanation: "E2" },
      ];

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        lessons: [{ _id: { toString: () => "lesson123" }, isPublished: true }],
      };

      // ✅ FIX: Mock Course.findById (needed when last lesson in chapter)
      const mockCourse = {
        _id: "course123",
        chapters: [{ _id: { toString: () => "chapter123" }, isPublished: true, lessons: [] }],
      };

      const mockProgress = {
        completedLessons: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });
      // ✅ ADD THIS:
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(mockProgress.completedLessons).toHaveLength(1);
      expect(mockProgress.save).toHaveBeenCalled();
    });

    test("should update attempts for repeat completion", async () => {
      mockRequest.params = { id: "lesson123" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockLesson = {
        _id: "lesson123",
        chapterId: "chapter123",
        quiz: { questions: ["q1"], passingScore: 70 },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q1", explanation: "E1" }];

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        lessons: [{ _id: { toString: () => "lesson123" }, isPublished: true }],
      };

      // ✅ FIX: Mock Course.findById (needed when last lesson in chapter)
      const mockCourse = {
        _id: "course123",
        chapters: [{ _id: { toString: () => "chapter123" }, isPublished: true, lessons: [] }],
      };

      const existingCompletion = {
        lessonId: { toString: () => "lesson123" },
        attempts: 1,
        quizScore: 1,
        completedAt: new Date(),
      };

      const mockProgress = {
        completedLessons: [existingCompletion],
        save: jest.fn().mockResolvedValue(true),
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });
      // ✅ ADD THIS:
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      expect(existingCompletion.attempts).toBe(2);
      expect(mockProgress.save).toHaveBeenCalled();
    });

    test("should find next lesson in same chapter", async () => {
      mockRequest.params = { id: "lesson1" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockLesson = {
        _id: "lesson1",
        chapterId: "chapter123",
        quiz: { questions: ["q1"], passingScore: 70 },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q1", explanation: "E1" }];

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        lessons: [
          { _id: "lesson1", isPublished: true },
          { _id: "lesson2", isPublished: true },
        ],
      };

      const mockProgress = {
        completedLessons: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.nextLessonId).toBe("lesson2");
    });

    test("should return null nextLessonId if last lesson in chapter", async () => {
      mockRequest.params = { id: "lesson2" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockLesson = {
        _id: "lesson2",
        chapterId: "chapter123",
        quiz: { questions: ["q1"], passingScore: 70 },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q1", explanation: "E1" }];

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        lessons: [
          { _id: "lesson1", isPublished: true },
          { _id: "lesson2", isPublished: true },
        ],
      };

      const mockCourse = {
        chapters: [{ _id: "chapter123", isPublished: true, lessons: [] }],
      };

      const mockProgress = {
        completedLessons: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (Lesson.findById as jest.Mock).mockResolvedValue(mockLesson);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (Chapter.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockChapter),
      });
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitLessonQuiz(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.nextLessonId).toBeNull();
    });
  });

  //*=====================================================
  //* PROGRESS TRACKING TESTS
  //*=====================================================

  describe("getUserProgress", () => {
    test("should return progress summary", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 2,
        currentLessonNumber: 3,
        completedLessons: [{ lessonId: "l1" }, { lessonId: "l2" }, { lessonId: "l3" }],
        chapterTestAttempts: [
          { chapterId: "ch1", passed: true },
          { chapterId: "ch2", passed: false },
        ],
        finalExamAttempts: [{ passed: false }],
        courseCompleted: false,
        certificateIssued: false,
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await getUserProgress(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        progress: {
          currentChapter: 2,
          currentLesson: 3,
          completedLessons: 3,
          chapterTestsCompleted: 1,
          finalExamPassed: false,
          courseCompleted: false,
          certificateIssued: false,
        },
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = undefined;

      await getUserProgress(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should create progress if none exists", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "newuser" };

      const newProgress = {
        currentChapterNumber: 1,
        currentLessonNumber: 1,
        completedLessons: [],
        chapterTestAttempts: [],
        finalExamAttempts: [],
        courseCompleted: false,
        certificateIssued: false,
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(null);
      (UserProgress.create as jest.Mock).mockResolvedValue(newProgress);

      await getUserProgress(mockRequest, mockResponse as Response, mockNext);

      expect(UserProgress.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("should detect if final exam was passed", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 5,
        currentLessonNumber: 10,
        completedLessons: [],
        chapterTestAttempts: [],
        finalExamAttempts: [{ passed: false }, { passed: true }],
        courseCompleted: true,
        certificateIssued: true,
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await getUserProgress(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.progress.finalExamPassed).toBe(true);
    });
  });

  describe("getDetailedProgress", () => {
    test("should return detailed progress breakdown", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 1,
        currentLessonNumber: 2,
        completedLessons: [
          {
            lessonId: { toString: () => "lesson1" },
            quizScore: 5,
            attempts: 1,
            completedAt: new Date(),
          },
        ],
        chapterTestAttempts: [],
        finalExamAttempts: [],
        courseCompleted: false,
        certificateIssued: false,
        completedAt: null,
      };

      const mockCourse = {
        _id: "course123",
        chapters: [
          {
            _id: "chapter1",
            chapterNumber: 1,
            title: "Chapter 1",
            lessons: [
              { _id: "lesson1", lessonNumber: 1, title: "Lesson 1", isPublished: true },
              { _id: "lesson2", lessonNumber: 2, title: "Lesson 2", isPublished: true },
            ],
          },
        ],
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        progress: expect.objectContaining({
          currentChapter: 1,
          currentLesson: 2,
          chapters: expect.arrayContaining([
            expect.objectContaining({
              chapterId: "chapter1",
              chapterNumber: 1,
              lessons: expect.any(Array),
            }),
          ]),
          nextAction: expect.any(Object),
        }),
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = undefined;

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 for non-existent course", async () => {
      mockRequest.params = { courseId: "nonexistent" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        completedLessons: [],
        chapterTestAttempts: [],
        finalExamAttempts: [],
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should recommend next lesson if incomplete", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 1,
        currentLessonNumber: 1,
        completedLessons: [],
        chapterTestAttempts: [],
        finalExamAttempts: [],
        courseCompleted: false,
      };

      const mockCourse = {
        _id: "course123",
        chapters: [
          {
            _id: "chapter1",
            chapterNumber: 1,
            title: "Chapter 1",
            lessons: [{ _id: "lesson1", lessonNumber: 1, title: "Intro", isPublished: true }],
          },
        ],
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.progress.nextAction.type).toBe("lesson");
    });

    test("should recommend chapter test if all lessons complete", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 1,
        currentLessonNumber: 2,
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }, { lessonId: { toString: () => "lesson2" } }],
        chapterTestAttempts: [],
        finalExamAttempts: [],
        courseCompleted: false,
      };

      const mockCourse = {
        _id: "course123",
        chapters: [
          {
            _id: "chapter1",
            chapterNumber: 1,
            title: "Chapter 1",
            lessons: [
              { _id: "lesson1", lessonNumber: 1, title: "L1", isPublished: true },
              { _id: "lesson2", lessonNumber: 2, title: "L2", isPublished: true },
            ],
          },
        ],
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.progress.nextAction.type).toBe("chapter-test");
    });

    test("should recommend final exam if all chapters passed", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 1,
        currentLessonNumber: 1,
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }],
        chapterTestAttempts: [{ chapterId: { toString: () => "chapter1" }, passed: true }],
        finalExamAttempts: [],
        courseCompleted: false,
      };

      const mockCourse = {
        _id: "course123",
        chapters: [
          {
            _id: "chapter1",
            chapterNumber: 1,
            title: "Chapter 1",
            lessons: [{ _id: "lesson1", lessonNumber: 1, title: "L1", isPublished: true }],
          },
        ],
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.progress.nextAction.type).toBe("final-exam");
    });

    test("should show completion if exam passed", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockProgress = {
        currentChapterNumber: 1,
        currentLessonNumber: 1,
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }],
        chapterTestAttempts: [{ chapterId: { toString: () => "chapter1" }, passed: true }],
        finalExamAttempts: [{ passed: true, score: 95 }],
        courseCompleted: true,
      };

      const mockCourse = {
        _id: "course123",
        chapters: [
          {
            _id: "chapter1",
            chapterNumber: 1,
            title: "Chapter 1",
            lessons: [{ _id: "lesson1", lessonNumber: 1, title: "L1", isPublished: true }],
          },
        ],
      };

      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getDetailedProgress(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.progress.nextAction.type).toBe("completed");
    });
  });

  //*=====================================================
  //* CHAPTER TEST TESTS
  //*=====================================================

  describe("startChapterTest", () => {
    test("should create test session and return questions", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockChapter = {
        _id: "chapter123",
        title: "Medical Terminology",
        isPublished: true,
        courseId: "course123",
        chapterTest: {
          questions: ["q1", "q2", "q3"],
          passingScore: 70,
        },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Question 1",
          options: ["A", "B", "C", "D"],
          type: "multiple-choice",
          difficulty: "easy",
        },
        {
          _id: "q2",
          questionText: "Question 2",
          options: ["A", "B", "C", "D"],
          type: "multiple-choice",
          difficulty: "medium",
        },
      ];

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        questions: ["q1", "q2"],
        isActive: true,
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }, { lessonId: { toString: () => "lesson2" } }],
        chapterTestCooldowns: [],
      };

      const mockLessons = [{ _id: "lesson1" }, { _id: "lesson2" }];

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (TestSession.findOne as jest.Mock).mockResolvedValue(null);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Lesson.find as jest.Mock).mockResolvedValue(mockLessons);
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });
      (TestSession.create as jest.Mock).mockResolvedValue(mockSession);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        sessionId: "session123",
        test: expect.objectContaining({
          chapterId: "chapter123",
          chapterTitle: "Medical Terminology",
          totalQuestions: 2,
          passingScore: 70,
        }),
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = undefined;

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 for non-existent chapter", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.user = { userId: "user123", role: "Student" };

      (Chapter.findById as jest.Mock).mockResolvedValue(null);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should return 403 for unpublished chapter", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockChapter = {
        _id: "chapter123",
        isPublished: false,
      };

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    test("should return 400 if active session exists", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockChapter = {
        _id: "chapter123",
        isPublished: true,
      };

      const mockSession = {
        _id: "session456",
        isActive: true,
        isSubmitted: false,
      };

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "You already have an active test session",
        sessionId: "session456",
      });
    });

    test("should return 403 if lessons not completed", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockChapter = {
        _id: "chapter123",
        isPublished: true,
        courseId: "course123",
        chapterTest: { cooldownHours: 3 },
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }],
        chapterTestCooldowns: [],
      };

      const mockLessons = [{ _id: "lesson1" }, { _id: "lesson2" }, { _id: "lesson3" }];

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (TestSession.findOne as jest.Mock).mockResolvedValue(null);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Lesson.find as jest.Mock).mockResolvedValue(mockLessons);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "You must complete all lessons in this chapter before taking the test",
      });
    });

    test("should return 403 if cooldown active", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockChapter = {
        _id: "chapter123",
        isPublished: true,
        courseId: "course123",
        chapterTest: { cooldownHours: 3 },
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }, { lessonId: { toString: () => "lesson2" } }],
        chapterTestCooldowns: [
          {
            chapterId: { toString: () => "chapter123" },
            lastAttemptAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          },
        ],
      };

      const mockLessons = [{ _id: "lesson1" }, { _id: "lesson2" }];

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (TestSession.findOne as jest.Mock).mockResolvedValue(null);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Lesson.find as jest.Mock).mockResolvedValue(mockLessons);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Test is on cooldown",
          remainingMinutes: expect.any(Number),
        })
      );
    });

    test("should bypass checks for Admin users", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "admin123", role: "Admin" };

      const mockChapter = {
        _id: "chapter123",
        title: "Chapter",
        isPublished: true,
        chapterTest: {
          questions: ["q1"],
          passingScore: 70,
        },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Q",
          options: ["A", "B"],
          type: "multiple-choice",
          difficulty: "easy",
        },
      ];

      const mockSession = {
        _id: "session123",
      };

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (TestSession.findOne as jest.Mock).mockResolvedValue(null);
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });
      (TestSession.create as jest.Mock).mockResolvedValue(mockSession);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(UserProgress.findOne).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("should select 20 random questions if more than 20 available", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.user = { userId: "user123", role: "Admin" };

      const mockChapter = {
        _id: "chapter123",
        title: "Chapter",
        isPublished: true,
        chapterTest: {
          questions: Array.from({ length: 30 }, (_, i) => `q${i}`),
          passingScore: 70,
        },
      };

      const mockQuestions = Array.from({ length: 30 }, (_, i) => ({
        _id: `q${i}`,
        questionText: `Question ${i}`,
        options: ["A", "B", "C", "D"],
        type: "multiple-choice",
        difficulty: "easy",
      }));

      const mockSession = { _id: "session123" };

      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (TestSession.findOne as jest.Mock).mockResolvedValue(null);
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });
      (TestSession.create as jest.Mock).mockResolvedValue(mockSession);

      await startChapterTest(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.test.totalQuestions).toBe(20);
    });
  });

  describe("submitChapterTest", () => {
    test("should grade test and update progress", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = {
        sessionId: "session123",
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q2", selectedAnswer: "B" },
        ],
      };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        questions: ["q1", "q2"],
        isSubmitted: false,
        isAbandoned: false,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        chapterTest: { passingScore: 70 },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Question 1",
          correctAnswer: "A",
          explanation: "Explanation 1",
        },
        {
          _id: "q2",
          questionText: "Question 2",
          correctAnswer: "C",
          explanation: "Explanation 2",
        },
      ];

      const mockProgress = {
        chapterTestAttempts: [],
        chapterTestCooldowns: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);
      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockSession.isSubmitted).toBe(true);
      expect(mockSession.isActive).toBe(false);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 50,
          correctCount: 1,
          totalQuestions: 2,
          passed: false,
        })
      );
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123", answers: [] };
      mockRequest.user = undefined;

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 if session not found", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123", answers: [] };
      mockRequest.user = { userId: "user123" };

      (TestSession.findOne as jest.Mock).mockResolvedValue(null);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should return 400 if test already submitted", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123", answers: [] };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        isSubmitted: true,
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Test already submitted" });
    });

    test("should return 400 if test was abandoned", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123", answers: [] };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        isSubmitted: false,
        isAbandoned: true,
        isActive: false,
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Test was abandoned" });
    });

    test("should return 400 if session expired", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123", answers: [] };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        isSubmitted: false,
        isAbandoned: false,
        isActive: false,
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Test session expired" });
    });

    test("should update cooldown after submission", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = {
        sessionId: "session123",
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        questions: ["q1"],
        isSubmitted: false,
        isAbandoned: false,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        chapterTest: { passingScore: 70 },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Q",
          correctAnswer: "A",
          explanation: "E",
        },
      ];

      const mockProgress = {
        chapterTestAttempts: [],
        chapterTestCooldowns: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);
      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockProgress.chapterTestCooldowns).toHaveLength(1);
      expect(mockProgress.save).toHaveBeenCalled();
    });

    test('should handle "No answer" for unanswered questions', async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = {
        sessionId: "session123",
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q2", selectedAnswer: null },
        ],
      };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        questions: ["q1", "q2"],
        isSubmitted: false,
        isAbandoned: false,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
        chapterTest: { passingScore: 70 },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Q1",
          correctAnswer: "A",
          explanation: "E1",
        },
        {
          _id: "q2",
          questionText: "Q2",
          correctAnswer: "B",
          explanation: "E2",
        },
      ];

      const mockProgress = {
        chapterTestAttempts: [],
        chapterTestCooldowns: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);
      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitChapterTest(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.results[1].selectedAnswer).toBe("No answer");
    });
  });

  describe("abandonChapterTest", () => {
    test("should mark test as abandoned and trigger cooldown", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123" };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        isSubmitted: false,
        isAbandoned: false,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
      };

      const mockProgress = {
        chapterTestCooldowns: [],
        save: jest.fn().mockResolvedValue(true),
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);
      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await abandonChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockSession.isAbandoned).toBe(true);
      expect(mockSession.isActive).toBe(false);
      expect(mockProgress.chapterTestCooldowns).toHaveLength(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Test abandoned. 3-hour cooldown activated.",
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123" };
      mockRequest.user = undefined;

      await abandonChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 if session not found", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123" };
      mockRequest.user = { userId: "user123" };

      (TestSession.findOne as jest.Mock).mockResolvedValue(null);

      await abandonChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should return 400 if test already submitted", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123" };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        isSubmitted: true,
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);

      await abandonChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Test already submitted" });
    });

    test("should update existing cooldown", async () => {
      mockRequest.params = { id: "chapter123" };
      mockRequest.body = { sessionId: "session123" };
      mockRequest.user = { userId: "user123" };

      const mockSession = {
        _id: "session123",
        userId: "user123",
        chapterId: "chapter123",
        isSubmitted: false,
        isAbandoned: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockChapter = {
        _id: "chapter123",
        courseId: "course123",
      };

      const existingCooldown = {
        chapterId: { toString: () => "chapter123" },
        lastAttemptAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      };

      const mockProgress = {
        chapterTestCooldowns: [existingCooldown],
        save: jest.fn().mockResolvedValue(true),
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockSession);
      (Chapter.findById as jest.Mock).mockResolvedValue(mockChapter);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await abandonChapterTest(mockRequest, mockResponse as Response, mockNext);

      expect(mockProgress.chapterTestCooldowns).toHaveLength(1);
      expect(existingCooldown.lastAttemptAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  //*=====================================================
  //* FINAL EXAM TESTS (Part 1 - getFinalExam)
  //*=====================================================

  describe("getFinalExam", () => {
    test("should return exam questions for eligible user", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockCourse = {
        _id: "course123",
        title: "Medical Interpreter Course",
        isPublished: true,
        finalExam: {
          questions: ["q1", "q2", "q3"],
          passingScore: 75,
          timeLimit: 60,
          cooldownHours: 24,
        },
        chapters: [
          {
            _id: "chapter1",
            lessons: [
              { _id: "lesson1", isPublished: true },
              { _id: "lesson2", isPublished: true },
            ],
          },
        ],
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }, { lessonId: { toString: () => "lesson2" } }],
        chapterTestAttempts: [{ chapterId: { toString: () => "chapter1" }, passed: true }],
        finalExamCooldown: null,
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Question 1",
          options: ["A", "B", "C", "D"],
          type: "multiple-choice",
          difficulty: "hard",
        },
      ];

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        exam: expect.objectContaining({
          courseId: "course123",
          courseTitle: "Medical Interpreter Course",
          totalQuestions: 1,
          passingScore: 75,
          timeLimit: 60,
        }),
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = undefined;

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 for non-existent course", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.user = { userId: "user123", role: "Student" };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should return 403 for unpublished course", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockCourse = {
        _id: "course123",
        isPublished: false,
      };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    test("should return 403 if not all lessons completed", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockCourse = {
        _id: "course123",
        isPublished: true,
        finalExam: { cooldownHours: 24 },
        chapters: [
          {
            _id: "chapter1",
            lessons: [
              { _id: "lesson1", isPublished: true },
              { _id: "lesson2", isPublished: true },
            ],
          },
        ],
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }],
        chapterTestAttempts: [],
      };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You must complete all lessons before taking the final exam",
        })
      );
    });

    test("should return 403 if not all chapter tests passed", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockCourse = {
        _id: "course123",
        isPublished: true,
        finalExam: { cooldownHours: 24 },
        chapters: [
          {
            _id: "chapter1",
            lessons: [{ _id: "lesson1", isPublished: true }],
          },
          {
            _id: "chapter2",
            lessons: [{ _id: "lesson2", isPublished: true }],
          },
        ],
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }, { lessonId: { toString: () => "lesson2" } }],
        chapterTestAttempts: [{ chapterId: { toString: () => "chapter1" }, passed: true }],
      };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You must pass all chapter tests before taking the final exam",
        })
      );
    });

    test("should return 403 if cooldown active", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockCourse = {
        _id: "course123",
        isPublished: true,
        finalExam: { cooldownHours: 24 },
        chapters: [
          {
            _id: "chapter1",
            lessons: [{ _id: "lesson1", isPublished: true }],
          },
        ],
      };

      const mockProgress = {
        completedLessons: [{ lessonId: { toString: () => "lesson1" } }],
        chapterTestAttempts: [{ chapterId: { toString: () => "chapter1" }, passed: true }],
        finalExamCooldown: {
          lastAttemptAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      };

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Final exam is on cooldown",
          remainingMinutes: expect.any(Number),
        })
      );
    });

    test("should bypass checks for Admin users", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "admin123", role: "Admin" };

      const mockCourse = {
        _id: "course123",
        title: "Course",
        isPublished: true,
        finalExam: {
          questions: ["q1"],
          passingScore: 75,
          timeLimit: 60,
        },
        chapters: [],
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Q",
          options: ["A", "B"],
          type: "multiple-choice",
          difficulty: "easy",
        },
      ];

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(UserProgress.findOne).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("should bypass checks for SuperVisor users", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.user = { userId: "supervisor123", role: "SuperVisor" };

      const mockCourse = {
        _id: "course123",
        title: "Course",
        isPublished: true,
        finalExam: {
          questions: ["q1"],
          passingScore: 75,
          timeLimit: 60,
        },
        chapters: [],
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Q",
          options: ["A", "B"],
          type: "multiple-choice",
          difficulty: "easy",
        },
      ];

      (Course.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse),
      });
      (Question.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockQuestions),
      });

      await getFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(UserProgress.findOne).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  //*=====================================================
  //* FINAL EXAM TESTS (Part 2 - submitFinalExam)
  //*=====================================================

  describe("submitFinalExam", () => {
    test("should grade exam and generate certificates if passed", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = {
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q2", selectedAnswer: "B" },
        ],
      };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        title: "Medical Interpreter Course",
        finalExam: {
          questions: ["q1", "q2"],
          passingScore: 50,
          cooldownHours: 24,
        },
      };

      const mockQuestions = [
        {
          _id: "q1",
          questionText: "Q1",
          correctAnswer: "A",
          explanation: "E1",
        },
        {
          _id: "q2",
          questionText: "Q2",
          correctAnswer: "B",
          explanation: "E2",
        },
      ];

      const mockProgress = {
        finalExamAttempts: [],
        finalExamCooldown: null,
        courseCompleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      };

      const mockMainCert = {
        certificateNumber: "MIC-2024-123456",
        verificationCode: "123456",
        issuedAt: new Date(),
        certificateImageUrl: "https://cloudinary.com/main.jpg",
      };

      const mockHipaaCert = {
        certificateNumber: "HIPAA-2024-654321",
        verificationCode: "654321",
        issuedAt: new Date(),
        certificateImageUrl: "https://cloudinary.com/hipaa.jpg",
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateCertificateNumber as jest.Mock).mockReturnValueOnce("MIC-2024-123456").mockReturnValueOnce("HIPAA-2024-654321");
      (generateVerificationCode as jest.Mock).mockReturnValueOnce("123456").mockReturnValueOnce("654321");
      (generateCertificate as jest.Mock).mockResolvedValueOnce("https://cloudinary.com/main.jpg").mockResolvedValueOnce("https://cloudinary.com/hipaa.jpg");
      (Certificate.create as jest.Mock).mockResolvedValueOnce(mockMainCert).mockResolvedValueOnce(mockHipaaCert);
      (sendCertificateEmail as jest.Mock).mockResolvedValue(true);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 100,
          correctCount: 2,
          totalQuestions: 2,
          passed: true,
          courseCompleted: true,
          certificateIssued: true,
          certificates: expect.objectContaining({
            main: expect.objectContaining({
              certificateNumber: "MIC-2024-123456",
            }),
            hipaa: expect.objectContaining({
              certificateNumber: "HIPAA-2024-654321",
            }),
          }),
        })
      );
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = { answers: [] };
      mockRequest.user = undefined;

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 for non-existent course", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.body = { answers: [] };
      mockRequest.user = { userId: "user123" };

      (Course.findById as jest.Mock).mockResolvedValue(null);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should return 403 if cooldown active", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = { answers: [] };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        finalExam: { cooldownHours: 24 },
      };

      const mockProgress = {
        finalExamCooldown: {
          lastAttemptAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Final exam is on cooldown. You cannot submit another attempt yet.",
        })
      );
    });

    test("should return 400 if no questions found", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = { answers: [] };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        finalExam: { questions: ["q1"], cooldownHours: 24 },
      };

      const mockProgress = {
        finalExamCooldown: null,
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue([]);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test("should not issue certificates if failed", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = {
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q2", selectedAnswer: "X" },
        ],
      };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        title: "Course",
        finalExam: {
          questions: ["q1", "q2"],
          passingScore: 75,
          cooldownHours: 24,
        },
      };

      const mockQuestions = [
        { _id: "q1", correctAnswer: "A", questionText: "Q1", explanation: "E1" },
        { _id: "q2", correctAnswer: "B", questionText: "Q2", explanation: "E2" },
      ];

      const mockProgress = {
        finalExamAttempts: [],
        finalExamCooldown: null,
        courseCompleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          passed: false,
          courseCompleted: false,
        })
      );
      expect(Certificate.create).not.toHaveBeenCalled();
    });

    test("should not issue duplicate certificates if already completed", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        finalExam: {
          questions: ["q1"],
          passingScore: 50,
          cooldownHours: 24,
        },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q", explanation: "E" }];

      const mockProgress = {
        finalExamAttempts: [],
        finalExamCooldown: null,
        courseCompleted: true, // Already completed!
        save: jest.fn().mockResolvedValue(true),
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(Certificate.create).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          passed: true,
          courseCompleted: true,
        })
      );
    });

    test("should handle certificate generation errors gracefully", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        title: "Course",
        finalExam: {
          questions: ["q1"],
          passingScore: 50,
          cooldownHours: 24,
        },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q", explanation: "E" }];

      const mockProgress = {
        finalExamAttempts: [],
        finalExamCooldown: null,
        courseCompleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateCertificateNumber as jest.Mock).mockReturnValue("CERT-123");
      (generateVerificationCode as jest.Mock).mockReturnValue("123456");
      (generateCertificate as jest.Mock).mockRejectedValue(new Error("Cloudinary error"));

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    test("should continue if email fails (non-blocking)", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "A" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        title: "Course",
        finalExam: {
          questions: ["q1"],
          passingScore: 50,
          cooldownHours: 24,
        },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q", explanation: "E" }];

      const mockProgress = {
        finalExamAttempts: [],
        finalExamCooldown: null,
        courseCompleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateCertificateNumber as jest.Mock).mockReturnValue("CERT-123");
      (generateVerificationCode as jest.Mock).mockReturnValue("123456");
      (generateCertificate as jest.Mock).mockResolvedValue("https://url.com/cert.jpg");
      (Certificate.create as jest.Mock).mockResolvedValue({
        certificateNumber: "CERT-123",
        verificationCode: "123456",
        issuedAt: new Date(),
        certificateImageUrl: "https://url.com/cert.jpg",
      });
      (sendCertificateEmail as jest.Mock).mockRejectedValue(new Error("Email service down"));
      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      // Should still return 200 even if email failed
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          passed: true,
          certificateIssued: true,
        })
      );
    });

    test("should update cooldown after submission", async () => {
      mockRequest.params = { id: "course123" };
      mockRequest.body = {
        answers: [{ questionId: "q1", selectedAnswer: "X" }],
      };
      mockRequest.user = { userId: "user123" };

      const mockCourse = {
        _id: "course123",
        finalExam: {
          questions: ["q1"],
          passingScore: 100,
          cooldownHours: 24,
        },
      };

      const mockQuestions = [{ _id: "q1", correctAnswer: "A", questionText: "Q", explanation: "E" }];

      const mockProgress: any = {
        // ✅ FIX: Type as 'any'
        finalExamAttempts: [],
        finalExamCooldown: null,
        courseCompleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserProgress.findOne as jest.Mock).mockResolvedValue(mockProgress);
      (Question.find as jest.Mock).mockResolvedValue(mockQuestions);

      await submitFinalExam(mockRequest, mockResponse as Response, mockNext);

      // ✅ Now TypeScript won't complain
      expect(mockProgress.finalExamCooldown).toBeTruthy();
      expect(mockProgress.finalExamCooldown.lastAttemptAt).toBeInstanceOf(Date);
    });
  });
  //=====================================================
  // CERTIFICATE TESTS
  //*=====================================================
  describe("getUserCertificate", () => {
    test("should return user certificate", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };
      const mockCertificate = {
        certificateNumber: "MIC-2024-123456",
        verificationCode: "123456",
        userName: "John Doe",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-01-15"),
        finalExamScore: 95,
        issuedAt: new Date("2024-01-15"),
      };

      (Certificate.findOne as jest.Mock).mockResolvedValue(mockCertificate);

      await getUserCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        certificate: expect.objectContaining({
          certificateNumber: "MIC-2024-123456",
          verificationCode: "123456",
        }),
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = undefined;

      await getUserCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 if certificate not found", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      (Certificate.findOne as jest.Mock).mockResolvedValue(null);

      await getUserCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
  describe("getUserCertificates", () => {
    test("should return both main and HIPAA certificates", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };
      const mockCertificates = [
        {
          certificateNumber: "MIC-2024-123456",
          verificationCode: "123456",
          userName: "John Doe",
          courseTitle: "Medical Interpreter Course",
          completionDate: new Date("2024-01-15"),
          finalExamScore: 95,
          issuedAt: new Date("2024-01-15"),
          certificateImageUrl: "https://url.com/main.jpg",
        },
        {
          certificateNumber: "HIPAA-2024-654321",
          verificationCode: "654321",
          userName: "John Doe",
          courseTitle: "HIPAA for Medical Interpreters",
          completionDate: new Date("2024-01-15"),
          finalExamScore: 95,
          issuedAt: new Date("2024-01-15"),
          certificateImageUrl: "https://url.com/hipaa.jpg",
        },
      ];

      (Certificate.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCertificates),
      });

      await getUserCertificates(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        certificates: {
          main: expect.objectContaining({
            certificateNumber: "MIC-2024-123456",
          }),
          hipaa: expect.objectContaining({
            certificateNumber: "HIPAA-2024-654321",
          }),
        },
      });
    });

    test("should return 401 for unauthenticated users", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = undefined;

      await getUserCertificates(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 if no certificates found", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      (Certificate.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await getUserCertificates(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should handle missing main certificate", async () => {
      mockRequest.params = { courseId: "course123" };
      mockRequest.user = { userId: "user123" };

      const mockCertificates = [
        {
          courseTitle: "HIPAA for Medical Interpreters",
          certificateNumber: "HIPAA-123",
          verificationCode: "123456",
          userName: "John",
          completionDate: new Date(),
          finalExamScore: 90,
          issuedAt: new Date(),
          certificateImageUrl: "https://url.com/hipaa.jpg",
        },
      ];

      (Certificate.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCertificates),
      });

      await getUserCertificates(mockRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.certificates.main).toBeNull();
      expect(response.certificates.hipaa).toBeTruthy();
    });
  });
  describe("verifyCertificate", () => {
    test("should verify valid certificate", async () => {
      mockRequest.query = {
        certificateNumber: "MIC-2024-123456",
        verificationCode: "123456",
      };
      const mockCertificate = {
        certificateNumber: "MIC-2024-123456",
        userName: "John Doe",
        courseTitle: "Medical Interpreter Course",
        completionDate: new Date("2024-01-15"),
        issuedAt: new Date("2024-01-15"),
      };

      (Certificate.findOne as jest.Mock).mockResolvedValue(mockCertificate);

      await verifyCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        valid: true,
        certificate: expect.objectContaining({
          certificateNumber: "MIC-2024-123456",
          userName: "John Doe",
        }),
      });
    });

    test("should return 400 if parameters missing", async () => {
      mockRequest.query = {
        certificateNumber: "MIC-2024-123456",
        // verificationCode missing
      };

      await verifyCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Certificate number and verification code are required",
      });
    });

    test("should return 404 for invalid certificate", async () => {
      mockRequest.query = {
        certificateNumber: "INVALID-123",
        verificationCode: "999999",
      };

      (Certificate.findOne as jest.Mock).mockResolvedValue(null);

      await verifyCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        valid: false,
        message: "Certificate not found or verification code is incorrect",
      });
    });

    test("should be case-sensitive for verification code", async () => {
      mockRequest.query = {
        certificateNumber: "MIC-2024-123456",
        verificationCode: "123456",
      };

      (Certificate.findOne as jest.Mock).mockImplementation((query: any) => {
        if (query.certificateNumber === "MIC-2024-123456" && query.verificationCode === "123456") {
          return Promise.resolve({ certificateNumber: "MIC-2024-123456" });
        }
        return Promise.resolve(null);
      });

      await verifyCertificate(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
