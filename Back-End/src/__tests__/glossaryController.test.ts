import { Request, Response, NextFunction } from "express";
import { getTerm, createTerm, bulkCreateTerms } from "../controllers/glossaryController";

import GlossaryTerm from "../models/GlossaryTerm";

// Mock dependencies
jest.mock("../models/GlossaryTerm");

describe("Glossary Controller - Medical Terminology Tests", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
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
  //* GET TERM TESTS
  //*=====================================================

  describe("getTerm", () => {
    test("should return term and explanation for exact match", async () => {
      mockRequest.params = { term: "triage" };

      const mockGlossaryTerm = {
        term: "triage",
        explanation: "The process of determining the priority of patients treatments",
      };

      (GlossaryTerm.findOne as jest.Mock).mockResolvedValue(mockGlossaryTerm);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.findOne).toHaveBeenCalledWith({ term: "triage" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        term: "triage",
        explanation: "The process of determining the priority of patients treatments",
      });
    });

    test("should perform case-insensitive search (HIPAA finds hipaa)", async () => {
      mockRequest.params = { term: "HIPAA" };

      const mockGlossaryTerm = {
        term: "hipaa",
        explanation: "Health Insurance Portability and Accountability Act",
      };

      (GlossaryTerm.findOne as jest.Mock).mockResolvedValue(mockGlossaryTerm);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.findOne).toHaveBeenCalledWith({ term: "hipaa" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        term: "hipaa",
        explanation: "Health Insurance Portability and Accountability Act",
      });
    });

    test("should trim whitespace from search term", async () => {
      mockRequest.params = { term: "  medical interpreter  " };

      const mockGlossaryTerm = {
        term: "medical interpreter",
        explanation: "A professional who facilitates communication...",
      };

      (GlossaryTerm.findOne as jest.Mock).mockResolvedValue(mockGlossaryTerm);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.findOne).toHaveBeenCalledWith({
        term: "medical interpreter",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("should return 404 for non-existent term", async () => {
      mockRequest.params = { term: "nonexistentterm" };

      (GlossaryTerm.findOne as jest.Mock).mockResolvedValue(null);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "Term not found" });
    });

    test("should handle database query errors", async () => {
      mockRequest.params = { term: "triage" };

      const dbError = new Error("Database connection failed");
      (GlossaryTerm.findOne as jest.Mock).mockRejectedValue(dbError);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should handle empty term parameter", async () => {
      mockRequest.params = { term: "" };

      (GlossaryTerm.findOne as jest.Mock).mockResolvedValue(null);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.findOne).toHaveBeenCalledWith({ term: "" });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test("should handle special characters in term", async () => {
      mockRequest.params = { term: "C-section" };

      const mockGlossaryTerm = {
        term: "c-section",
        explanation: "Cesarean section surgical procedure",
      };

      (GlossaryTerm.findOne as jest.Mock).mockResolvedValue(mockGlossaryTerm);

      await getTerm(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.findOne).toHaveBeenCalledWith({ term: "c-section" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  //*=====================================================
  //* CREATE TERM TESTS
  //*=====================================================

  describe("createTerm", () => {
    test("should create term with normalized name (lowercase + trim)", async () => {
      mockRequest.body = {
        term: "  TRIAGE  ",
        explanation: "The process of determining priority",
      };

      const mockCreatedTerm = {
        _id: "term123",
        term: "triage",
        explanation: "The process of determining priority",
      };

      (GlossaryTerm.create as jest.Mock).mockResolvedValue(mockCreatedTerm);

      await createTerm(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.create).toHaveBeenCalledWith({
        term: "triage",
        explanation: "The process of determining priority",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Term created successfully",
        term: mockCreatedTerm,
      });
    });

    test("should return created term data", async () => {
      mockRequest.body = {
        term: "HIPAA",
        explanation: "Health Insurance Portability and Accountability Act",
      };

      const mockCreatedTerm = {
        _id: "term456",
        term: "hipaa",
        explanation: "Health Insurance Portability and Accountability Act",
        createdAt: new Date(),
      };

      (GlossaryTerm.create as jest.Mock).mockResolvedValue(mockCreatedTerm);

      await createTerm(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Term created successfully",
        term: expect.objectContaining({
          _id: "term456",
          term: "hipaa",
        }),
      });
    });

    test("should handle duplicate term creation", async () => {
      mockRequest.body = {
        term: "triage",
        explanation: "Duplicate term",
      };

      const duplicateError = new Error("Duplicate key error");
      (duplicateError as any).code = 11000;

      (GlossaryTerm.create as jest.Mock).mockRejectedValue(duplicateError);

      await createTerm(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
    });

    test("should handle database insertion errors", async () => {
      mockRequest.body = {
        term: "test",
        explanation: "Test explanation",
      };

      const dbError = new Error("Database write failed");
      (GlossaryTerm.create as jest.Mock).mockRejectedValue(dbError);

      await createTerm(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  //*=====================================================
  //* BULK CREATE TERMS TESTS
  //*=====================================================

  describe("bulkCreateTerms", () => {
    test("should create multiple terms at once", async () => {
      mockRequest.body = {
        terms: [
          { term: "TRIAGE", explanation: "Priority determination" },
          { term: "  HIPAA  ", explanation: "Privacy law" },
          { term: "Informed Consent", explanation: "Patient agreement" },
        ],
      };

      const mockCreatedTerms = [
        { _id: "1", term: "triage", explanation: "Priority determination" },
        { _id: "2", term: "hipaa", explanation: "Privacy law" },
        { _id: "3", term: "informed consent", explanation: "Patient agreement" },
      ];

      (GlossaryTerm.insertMany as jest.Mock).mockResolvedValue(mockCreatedTerms);

      await bulkCreateTerms(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.insertMany).toHaveBeenCalledWith([
        { term: "triage", explanation: "Priority determination" },
        { term: "hipaa", explanation: "Privacy law" },
        { term: "informed consent", explanation: "Patient agreement" },
      ]);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "3 terms created successfully",
        count: 3,
      });
    });

    test("should return correct count of created terms", async () => {
      mockRequest.body = {
        terms: [
          { term: "term1", explanation: "Explanation 1" },
          { term: "term2", explanation: "Explanation 2" },
          { term: "term3", explanation: "Explanation 3" },
          { term: "term4", explanation: "Explanation 4" },
          { term: "term5", explanation: "Explanation 5" },
        ],
      };

      const mockCreatedTerms = new Array(5).fill(null).map((_, i) => ({
        _id: `id${i}`,
        term: `term${i + 1}`,
        explanation: `Explanation ${i + 1}`,
      }));

      (GlossaryTerm.insertMany as jest.Mock).mockResolvedValue(mockCreatedTerms);

      await bulkCreateTerms(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "5 terms created successfully",
        count: 5,
      });
    });

    test("should return 400 for empty array", async () => {
      mockRequest.body = {
        terms: [],
      };

      await bulkCreateTerms(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Terms array is required",
      });
      expect(GlossaryTerm.insertMany).not.toHaveBeenCalled();
    });

    test("should return 400 for non-array input", async () => {
      mockRequest.body = {
        terms: "not an array",
      };

      await bulkCreateTerms(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Terms array is required",
      });
    });

    test("should handle database insertion errors in bulk", async () => {
      mockRequest.body = {
        terms: [
          { term: "term1", explanation: "Explanation 1" },
          { term: "term2", explanation: "Explanation 2" },
        ],
      };

      const dbError = new Error("Bulk insert failed");
      (GlossaryTerm.insertMany as jest.Mock).mockRejectedValue(dbError);

      await bulkCreateTerms(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    test("should normalize all terms before insertion", async () => {
      mockRequest.body = {
        terms: [
          { term: "  UPPER CASE  ", explanation: "Test 1" },
          { term: "MiXeD CaSe", explanation: "Test 2" },
          { term: "lower case", explanation: "Test 3" },
        ],
      };

      (GlossaryTerm.insertMany as jest.Mock).mockResolvedValue([
        { term: "upper case", explanation: "Test 1" },
        { term: "mixed case", explanation: "Test 2" },
        { term: "lower case", explanation: "Test 3" },
      ]);

      await bulkCreateTerms(mockRequest, mockResponse as Response, mockNext);

      expect(GlossaryTerm.insertMany).toHaveBeenCalledWith([
        { term: "upper case", explanation: "Test 1" },
        { term: "mixed case", explanation: "Test 2" },
        { term: "lower case", explanation: "Test 3" },
      ]);
    });
  });
});
