import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { isSuperVisor } from "../middleware/roleMiddleware";
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
} from "../controllers/adminController";
import { createCourseValidator, createChapterValidator, createLessonValidator, createQuestionValidator, assignQuestionsValidator } from "../validators/adminValidator";

const router = express.Router();

router.use(authMiddleware);
router.use(isSuperVisor);

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

router.post("/assign-questions", assignQuestionsValidator, assignQuestions);

router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/certificates", getAllCertificates);
router.get("/dashboard/users-progress", getAllUsersProgress);

export default router;
