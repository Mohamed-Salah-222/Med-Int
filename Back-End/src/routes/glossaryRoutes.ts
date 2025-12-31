import express from "express";
import { getTerm, createTerm, bulkCreateTerms } from "../controllers/glossaryController";
import authMiddleware from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = express.Router();

// Public route - get term explanation
router.get("/:term", getTerm);

// Admin routes - create terms
router.post("/", authMiddleware, requireAdmin, createTerm);
router.post("/bulk", authMiddleware, requireAdmin, bulkCreateTerms);

export default router;
