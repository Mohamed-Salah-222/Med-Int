import { Request, Response, NextFunction } from "express";
import GlossaryTerm from "../models/GlossaryTerm";

//*=====================================================
//* GLOSSARY TERM RETRIEVAL
//*=====================================================

//*--- Get Single Glossary Term by Name
export const getTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { term } = req.params;

    // Search case-insensitive and trimmed
    const glossaryTerm = await GlossaryTerm.findOne({
      term: term.toLowerCase().trim(),
    });

    if (!glossaryTerm) {
      res.status(404).json({ message: "Term not found" });
      return;
    }

    res.status(200).json({
      term: glossaryTerm.term,
      explanation: glossaryTerm.explanation,
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* GLOSSARY TERM CREATION
//*=====================================================

//*--- Create Single Glossary Term
export const createTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { term, explanation } = req.body;

    // Store normalized term (lowercase, trimmed)
    const newTerm = await GlossaryTerm.create({
      term: term.toLowerCase().trim(),
      explanation,
    });

    res.status(201).json({
      message: "Term created successfully",
      term: newTerm,
    });
  } catch (error) {
    next(error);
  }
};

//*--- Bulk Create Glossary Terms
export const bulkCreateTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { terms } = req.body; // Array of { term, explanation }

    // Validate terms array
    if (!Array.isArray(terms) || terms.length === 0) {
      res.status(400).json({ message: "Terms array is required" });
      return;
    }

    // Normalize and insert all terms
    const createdTerms = await GlossaryTerm.insertMany(
      terms.map((t) => ({
        term: t.term.toLowerCase().trim(),
        explanation: t.explanation,
      }))
    );

    res.status(201).json({
      message: `${createdTerms.length} terms created successfully`,
      count: createdTerms.length,
    });
  } catch (error) {
    next(error);
  }
};
