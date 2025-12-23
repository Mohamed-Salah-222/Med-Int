import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { isSuperVisor } from "../middleware/roleMiddleware";
import { createCourse, createChapter, createLesson, createQuestion, assignQuestions, getDashboardStats, getAllCertificates, getAllUsersProgress } from "../controllers/adminController";
import { createCourseValidator, createChapterValidator, createLessonValidator, createQuestionValidator, assignQuestionsValidator } from "../validators/adminValidator";

const router = express.Router();

router.use(authMiddleware);
router.use(isSuperVisor);

router.post("/courses", createCourseValidator, createCourse);
router.post("/chapters", createChapterValidator, createChapter);
router.post("/lessons", createLessonValidator, createLesson);
router.post("/questions", createQuestionValidator, createQuestion);
router.post("/assign-questions", assignQuestionsValidator, assignQuestions);

router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/certificates", getAllCertificates);
router.get("/dashboard/users-progress", getAllUsersProgress);

export default router;
