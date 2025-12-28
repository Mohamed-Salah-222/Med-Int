import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { isSuperVisor } from "../middleware/roleMiddleware";
import {
  createCourse,
  getAllCourses, // ADD
  getCourseById, // ADD
  updateCourse, // ADD
  deleteCourse, // ADD
  getAllChapters, // ADD
  getChapterById, // ADD
  updateChapter, // ADD
  deleteChapter, // ADD
  createChapter,
  createLesson,
  createQuestion,
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
router.get("/courses", getAllCourses); // ADD
router.get("/courses/:id", getCourseById); // ADD
router.post("/courses", createCourseValidator, createCourse);
router.put("/courses/:id", updateCourse); // ADD
router.delete("/courses/:id", deleteCourse); // ADD

// Chapter routes
router.get("/chapters", getAllChapters); // ADD
router.get("/chapters/:id", getChapterById); // ADD
router.post("/chapters", createChapterValidator, createChapter);
router.put("/chapters/:id", updateChapter); // ADD
router.delete("/chapters/:id", deleteChapter); // ADD

router.post("/lessons", createLessonValidator, createLesson);
router.post("/questions", createQuestionValidator, createQuestion);
router.post("/assign-questions", assignQuestionsValidator, assignQuestions);

router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/certificates", getAllCertificates);
router.get("/dashboard/users-progress", getAllUsersProgress);

export default router;
