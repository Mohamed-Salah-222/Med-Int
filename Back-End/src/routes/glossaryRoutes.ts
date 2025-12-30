import express from "express";
import { getTerm, createTerm, bulkCreateTerms } from "../controllers/glossaryController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Public route - get term explanation
router.get("/:term", getTerm);

// Admin routes - create terms
router.post("/", authMiddleware, createTerm);
router.post("/bulk", authMiddleware, bulkCreateTerms);

export default router;