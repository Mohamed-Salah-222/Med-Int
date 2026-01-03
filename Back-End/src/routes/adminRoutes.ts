import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";
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
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  assignQuestions,
  getDashboardStats,
  getAllCertificates,
  getAllUsersProgress,
  getStatistics,
  getAllUsers,
  getUserById,
  updateUserRole,
  resetTestCooldown,
  resetExamCooldown,
  deleteUser,
  resetUserProgress,
  getSettings,
  updateSettings,
  bulkCreateQuestions,
  getUserProgress,
  testEmail,
} from "../controllers/adminController";
import { createCourseValidator, createChapterValidator, createLessonValidator, createQuestionValidator, assignQuestionsValidator } from "../validators/adminValidator";

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin); // Changed from isSuperVisor

// Course routes
router.get("/courses", getAllCourses);
router.get("/courses/:id", getCourseById);
router.post("/courses", createCourseValidator, createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// Chapter routes
router.get("/chapters", getAllChapters);
router.get("/chapters/:id", getChapterById);
router.post("/chapters", createChapterValidator, createChapter);
router.put("/chapters/:id", updateChapter);
router.delete("/chapters/:id", deleteChapter);

// Lesson routes
router.get("/lessons", getAllLessons);
router.get("/lessons/:id", getLessonById);
router.post("/lessons", createLessonValidator, createLesson);
router.put("/lessons/:id", updateLesson);
router.delete("/lessons/:id", deleteLesson);

// Question routes
router.get("/questions", getAllQuestions);
router.get("/questions/:id", getQuestionById);
router.post("/questions", createQuestionValidator, createQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

router.post("/questions/bulk", bulkCreateQuestions);

router.post("/assign-questions", assignQuestionsValidator, assignQuestions);

router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/certificates", getAllCertificates);
router.get("/dashboard/users-progress", getAllUsersProgress);

router.get("/statistics", getStatistics);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/reset-test-cooldown", resetTestCooldown);
router.put("/users/:id/reset-exam-cooldown", resetExamCooldown);
router.delete("/users/:id", deleteUser);
router.delete("/users/:id/progress", resetUserProgress);

// Settings routes
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/settings/test-email", testEmail);

// In your admin routes file
router.get("/users/:userId/progress/:courseId", authMiddleware, requireAdmin, getUserProgress);

export default router;
