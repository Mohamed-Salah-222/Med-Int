import { body } from "express-validator";

export const submitQuizValidator = [body("answers").isArray({ min: 1 }).withMessage("Must provide at least one answer"), body("answers.*.questionId").isMongoId().withMessage("Invalid question ID"), body("answers.*.selectedAnswer").isString().trim().notEmpty().withMessage("Selected answer must be a non-empty string")];

export const submitTestValidator = [body("answers").isArray({ min: 1 }).withMessage("Must provide at least one answer"), body("answers.*.questionId").isMongoId().withMessage("Invalid question ID"), body("answers.*.selectedAnswer").isString().trim().notEmpty().withMessage("Selected answer must be a non-empty string")];
