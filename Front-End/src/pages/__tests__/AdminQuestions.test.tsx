import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminQuestions from "../AdminQuestions";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getAllQuestions: vi.fn(),
    getQuestionById: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
    assignQuestions: vi.fn(),
    getAllCourses: vi.fn(),
    getAllChapters: vi.fn(),
    getAllLessons: vi.fn(),
  },
}));

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock alert
const mockAlert = vi.fn();
window.alert = mockAlert;

// Mock data
const mockQuestionsData = {
  data: {
    questions: [
      {
        id: "q1",
        questionText: "What is the primary role of a medical interpreter?",
        options: ["Translate documents", "Facilitate communication", "Provide medical advice", "Schedule appointments"],
        correctAnswer: "Facilitate communication",
        type: "quiz",
        hasExplanation: true,
        hasAudio: false,
        createdAt: "2024-01-01",
        assignedTo: {
          type: "lesson",
          id: "lesson-1",
          title: "Introduction to Medical Interpreting",
        },
      },
      {
        id: "q2",
        questionText: "What does PHI stand for?",
        options: ["Personal Health Information", "Private Healthcare Institution", "Protected Health Information", "Public Health Initiative"],
        correctAnswer: "Protected Health Information",
        type: "test",
        hasExplanation: false,
        hasAudio: true,
        createdAt: "2024-01-02",
      },
      {
        id: "q3",
        questionText: "Which law governs patient privacy?",
        options: ["ACA", "HIPAA", "EMTALA", "COBRA"],
        correctAnswer: "HIPAA",
        type: "exam",
        hasExplanation: true,
        hasAudio: false,
        createdAt: "2024-01-03",
      },
    ],
  },
};

const mockQuestionDetail = {
  data: {
    question: {
      id: "q1",
      questionText: "What is the primary role of a medical interpreter?",
      options: ["Translate documents", "Facilitate communication", "Provide medical advice", "Schedule appointments"],
      correctAnswer: "Facilitate communication",
      type: "quiz",
      explanation: "Interpreters facilitate communication between patients and providers.",
      audioUrl: "",
    },
  },
};

const mockCoursesData = {
  data: {
    courses: [{ id: "course-1", title: "Medical Interpreter Training" }],
  },
};

const mockChaptersData = {
  data: {
    chapters: [{ id: "chapter-1", title: "Introduction", chapterNumber: 1 }],
  },
};

const mockLessonsData = {
  data: {
    lessons: [{ id: "lesson-1", title: "What is Interpretation?", lessonNumber: 1 }],
  },
};

// Helper to render with router
const renderAdminQuestions = () => {
  return render(
    <MemoryRouter>
      <AdminQuestions />
    </MemoryRouter>
  );
};

describe("AdminQuestions Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
    vi.mocked(adminAPI.getAllQuestions).mockResolvedValue(mockQuestionsData as any);
    vi.mocked(adminAPI.getQuestionById).mockResolvedValue(mockQuestionDetail as any);
    vi.mocked(adminAPI.getAllCourses).mockResolvedValue(mockCoursesData as any);
    vi.mocked(adminAPI.getAllChapters).mockResolvedValue(mockChaptersData as any);
    vi.mocked(adminAPI.getAllLessons).mockResolvedValue(mockLessonsData as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getAllQuestions).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminQuestions();

      expect(screen.getByText(/loading questions/i)).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/questions bank/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/manage and assign questions/i)).toBeInTheDocument();
    });

    it("should display create question button", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create question/i })).toBeInTheDocument();
      });
    });
  });

  describe("Statistics", () => {
    it("should display correct stats", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument(); // Total
      });

      // "1" appears twice (Assigned and With Audio), so check context
      const statCards = screen.getAllByText("1");
      expect(statCards.length).toBe(2); // Both stats show 1
      expect(screen.getByText("2")).toBeInTheDocument(); // Unassigned (q2, q3)
    });

    it("should display stat labels", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/total questions/i)).toBeInTheDocument();
      });

      // "Assigned" appears in stat label AND question status
      const assignedTexts = screen.getAllByText(/assigned/i);
      expect(assignedTexts.length).toBeGreaterThan(0);

      expect(screen.getByText(/with audio/i)).toBeInTheDocument();
    });
  });

  describe("Filters", () => {
    it("should display type filter", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/filter by type/i)).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("should filter by quiz type", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByRole("combobox"), "quiz");

      expect(adminAPI.getAllQuestions).toHaveBeenCalledWith("quiz");
    });

    it("should toggle unassigned filter", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      // Initially shows all 3 questions
      expect(screen.getAllByText(/What|PHI|Which/i).length).toBeGreaterThan(0);

      const toggleButton = screen.getByRole("button", { name: /show unassigned only/i });
      await user.click(toggleButton);

      // Should still show questions (filtering happens client-side)
      // Test checks the button state changed
      expect(toggleButton).toHaveClass("border-[#E87461]");
    });
  });

  describe("Questions List", () => {
    it("should render all questions", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/what does phi stand for/i)).toBeInTheDocument();
      expect(screen.getByText(/which law governs patient privacy/i)).toBeInTheDocument();
    });

    it("should display question type badges", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText("Quiz")).toBeInTheDocument();
      });

      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(screen.getByText("Exam")).toBeInTheDocument();
    });

    it("should show audio badge for questions with audio", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        const audioTexts = screen.getAllByText(/audio/i);
        // Should appear in: stat card label + badge on q2
        expect(audioTexts.length).toBe(2);
      });
    });

    it("should show explanation badge", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        const explanationBadges = screen.getAllByText(/explanation/i);
        expect(explanationBadges.length).toBe(2); // q1 and q3
      });
    });

    it("should display all options with correct answer highlighted", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/facilitate communication/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/translate documents/i)).toBeInTheDocument();
      expect(screen.getByText(/provide medical advice/i)).toBeInTheDocument();
      expect(screen.getByText(/schedule appointments/i)).toBeInTheDocument();
    });

    it("should show assignment status", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/assigned to lesson/i)).toBeInTheDocument();
      });

      const notAssigned = screen.getAllByText(/not assigned yet/i);
      expect(notAssigned.length).toBe(2); // q2 and q3
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no questions", async () => {
      vi.mocked(adminAPI.getAllQuestions).mockResolvedValue({
        data: { questions: [] },
      } as any);

      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/no questions yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Create Question", () => {
    it("should open create modal", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create question/i }));

      expect(screen.getByText(/create new question/i)).toBeInTheDocument();
    });

    it("should create question with valid data", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.createQuestion).mockResolvedValue({ data: {} } as any);

      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create question/i }));

      // Fill form
      const questionTextarea = screen.getByPlaceholderText(/what is the primary role/i);
      await user.type(questionTextarea, "Test question?");

      // Fill options
      const optionInputs = screen.getAllByPlaceholderText(/option [a-d]/i);
      await user.type(optionInputs[0], "Option A");
      await user.type(optionInputs[1], "Option B");
      await user.type(optionInputs[2], "Option C");
      await user.type(optionInputs[3], "Option D");

      // Select correct answer - it's the 3rd combobox (type, correct answer, explanation)
      const selects = screen.getAllByRole("combobox");
      const correctAnswerSelect = selects[2]; // Third select is correct answer
      await user.selectOptions(correctAnswerSelect, "Option A");

      // Submit
      const submitButtons = screen.getAllByRole("button", { name: /create question/i });
      await user.click(submitButtons[1]);

      await waitFor(() => {
        expect(adminAPI.createQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            questionText: "Test question?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
            type: "quiz",
          })
        );
      });
    });
  });

  describe("Edit Question", () => {
    it("should open edit modal with pre-filled data", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit question/i)).toBeInTheDocument();
      });

      expect(adminAPI.getQuestionById).toHaveBeenCalledWith("q1");
    });

    it("should update question", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateQuestion).mockResolvedValue({ data: {} } as any);

      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/what is the primary role/i)).toBeInTheDocument();
      });

      const questionTextarea = screen.getByDisplayValue(/what is the primary role/i);
      await user.clear(questionTextarea);
      await user.type(questionTextarea, "Updated question?");

      await user.click(screen.getByRole("button", { name: /update question/i }));

      await waitFor(() => {
        expect(adminAPI.updateQuestion).toHaveBeenCalledWith(
          "q1",
          expect.objectContaining({
            questionText: "Updated question?",
          })
        );
      });
    });
  });

  describe("Delete Question", () => {
    it("should open delete confirmation modal", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/delete question/i)).toBeInTheDocument();
    });

    it("should delete question", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.deleteQuestion).mockResolvedValue({ data: {} } as any);

      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      const confirmButtons = screen.getAllByRole("button");
      const deleteButton = confirmButtons.find((btn) => btn.textContent === "Delete" && btn.className.includes("bg-red-600"));

      await user.click(deleteButton!);

      await waitFor(() => {
        expect(adminAPI.deleteQuestion).toHaveBeenCalledWith("q1");
      });
    });
  });

  describe("Assign Question", () => {
    it("should open assign modal", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const assignButtons = screen.getAllByTitle(/assign question/i);
      await user.click(assignButtons[0]);

      // Use heading to find the modal title specifically
      expect(screen.getByRole("heading", { name: /assign question/i })).toBeInTheDocument();
    });

    it("should display target type buttons", async () => {
      const user = userEvent.setup();
      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const assignButtons = screen.getAllByTitle(/assign question/i);
      await user.click(assignButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /assign question/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /lesson quiz/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /chapter test/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /final exam/i })).toBeInTheDocument();
    });

    it("should assign question to lesson", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.assignQuestions).mockResolvedValue({ data: {} } as any);

      renderAdminQuestions();

      await waitFor(() => {
        expect(screen.getByText(/what is the primary role/i)).toBeInTheDocument();
      });

      const assignButtons = screen.getAllByTitle(/assign question/i);
      await user.click(assignButtons[0]);

      // Wait for modal and courses to load
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /assign question/i })).toBeInTheDocument();
      });

      // Wait for courses API call
      await waitFor(() => {
        expect(adminAPI.getAllCourses).toHaveBeenCalled();
      });

      // Now get all selects - the modal ones are at the end
      const allSelects = screen.getAllByRole("combobox");

      // Find the course select by checking which one has "Medical Interpreter Training" option
      await waitFor(() => {
        const courseSelect = allSelects.find((select) => select.querySelector('option[value="course-1"]'));
        expect(courseSelect).toBeDefined();
      });

      const courseSelect = allSelects.find((select) => select.querySelector('option[value="course-1"]'))!;

      await user.selectOptions(courseSelect, "course-1");

      // Wait for chapters
      await waitFor(() => {
        expect(adminAPI.getAllChapters).toHaveBeenCalledWith("course-1");
      });

      // Find chapter select
      const chapterSelect = allSelects.find((select) => select.querySelector('option[value="chapter-1"]'))!;

      await user.selectOptions(chapterSelect, "chapter-1");

      // Wait for lessons
      await waitFor(() => {
        expect(adminAPI.getAllLessons).toHaveBeenCalledWith("chapter-1");
      });

      // Find lesson select
      const lessonSelect = screen.getAllByRole("combobox").find((select) => select.querySelector('option[value="lesson-1"]'))!;

      await user.selectOptions(lessonSelect, "lesson-1");

      // Submit - find the modal's submit button by className (has gradient)
      const allAssignButtons = screen.getAllByRole("button", { name: /assign question/i });
      const submitButton = allAssignButtons.find((btn) => btn.className.includes("bg-gradient-to-r"));

      await user.click(submitButton!);

      await waitFor(() => {
        expect(adminAPI.assignQuestions).toHaveBeenCalledWith({
          targetId: "lesson-1",
          targetType: "lesson",
          questionIds: ["q1"],
        });
      });
    });
  });

  describe("API Calls", () => {
    it("should fetch questions on mount", async () => {
      renderAdminQuestions();

      await waitFor(() => {
        expect(adminAPI.getAllQuestions).toHaveBeenCalled();
      });
    });
  });
});
