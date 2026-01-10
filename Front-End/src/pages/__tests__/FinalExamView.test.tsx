import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FinalExamView from "../FinalExamView";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    checkFinalExamAccess: vi.fn(),
    getFinalExam: vi.fn(),
    submitFinalExam: vi.fn(),
  },
}));

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.confirm, alert, scrollTo
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
window.confirm = mockConfirm;
window.alert = mockAlert;
window.scrollTo = vi.fn();

// Mock data
const mockAccessAllowed = {
  data: {
    canAccess: true,
  },
};

const mockExamData = {
  data: {
    exam: {
      questions: [
        {
          _id: "q1",
          questionText: "What is medical interpretation?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          difficulty: "easy",
        },
        {
          _id: "q2",
          questionText: "What are HIPAA regulations?",
          options: ["Rule 1", "Rule 2", "Rule 3", "Rule 4"],
          difficulty: "medium",
        },
      ],
      passingScore: 80,
      timeLimit: 100,
    },
  },
};

const mockPassedResults = {
  data: {
    score: 90,
    correctCount: 18,
    totalQuestions: 20,
    passed: true,
    passingScore: 80,
    courseCompleted: true,
    certificateIssued: true,
    certificates: {
      main: {
        certificateNumber: "MIC-2024-001",
        verificationCode: "ABC123",
        issuedAt: "2024-01-20T10:00:00Z",
      },
      hipaa: {
        certificateNumber: "HIPAA-2024-001",
        verificationCode: "XYZ789",
        issuedAt: "2024-01-20T10:00:00Z",
      },
    },
    results: [
      {
        questionId: "q1",
        questionText: "What is medical interpretation?",
        selectedAnswer: "Option A",
        correctAnswer: "Option A",
        isCorrect: true,
        explanation: "Correct explanation",
      },
      {
        questionId: "q2",
        questionText: "What are HIPAA regulations?",
        selectedAnswer: "Rule 1",
        correctAnswer: "Rule 1",
        isCorrect: true,
      },
    ],
  },
};

const mockFailedResults = {
  data: {
    score: 60,
    correctCount: 12,
    totalQuestions: 20,
    passed: false,
    passingScore: 80,
    courseCompleted: false,
    certificateIssued: false,
    results: [
      {
        questionId: "q1",
        questionText: "What is medical interpretation?",
        selectedAnswer: "Option B",
        correctAnswer: "Option A",
        isCorrect: false,
      },
    ],
  },
};

// Helper to render with router
const renderFinalExamView = (courseId = "course-1") => {
  return render(
    <MemoryRouter initialEntries={[`/exam/final/${courseId}`]}>
      <Routes>
        <Route path="/exam/final/:id" element={<FinalExamView />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("FinalExamView Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockConfirm.mockClear();
    mockAlert.mockClear();
    vi.mocked(courseAPI.checkFinalExamAccess).mockResolvedValue(mockAccessAllowed as any);
    vi.mocked(courseAPI.getFinalExam).mockResolvedValue(mockExamData as any);
  });

  describe("Loading State", () => {
    it("should show loading while fetching", () => {
      vi.mocked(courseAPI.getFinalExam).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderFinalExamView();

      expect(screen.getByText(/checking access/i)).toBeInTheDocument();
    });
  });

  describe("Access Check", () => {
    it("should show locked message when access denied", async () => {
      vi.mocked(courseAPI.checkFinalExamAccess).mockRejectedValue({
        response: { data: { message: "Complete all chapter tests first" } },
      });

      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText(/final exam locked/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/complete all chapter tests first/i)).toBeInTheDocument();
    });
  });

  describe("Exam Header", () => {
    it("should display exam title", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Final Exam")).toBeInTheDocument();
      });

      expect(screen.getByText(/your last step to certification/i)).toBeInTheDocument();
    });

    it("should display progress counter", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText(/0\/2/i)).toBeInTheDocument(); // 0 answered out of 2
      });

      expect(screen.getByText("Questions Answered")).toBeInTheDocument();
    });
  });

  describe("Exam Rules", () => {
    it("should display exam rules", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText(/final exam rules/i)).toBeInTheDocument();
      });

      // "Passing score: 80%" is split - check for parts
      expect(screen.getByText(/passing score:/i)).toBeInTheDocument();
      expect(screen.getByText(/80%/i)).toBeInTheDocument();
      expect(screen.getByText(/24-hour cooldown/i)).toBeInTheDocument();
      expect(screen.getByText(/two certificates/i)).toBeInTheDocument();
    });
  });

  describe("Questions Display", () => {
    it("should display all questions", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText(/what is medical interpretation/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/what are hipaa regulations/i)).toBeInTheDocument();
    });

    it("should display question numbers", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Question 1")).toBeInTheDocument();
      });

      expect(screen.getByText("Question 2")).toBeInTheDocument();
    });

    it("should display difficulty badges", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("EASY")).toBeInTheDocument();
      });

      expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    });

    it("should display answer options", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      expect(screen.getByText("Rule 1")).toBeInTheDocument();
    });
  });

  describe("Answer Selection", () => {
    it("should allow selecting answers", async () => {
      const user = userEvent.setup();
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const radioA = screen.getByRole("radio", { name: /option a/i });
      await user.click(radioA);

      expect(radioA).toBeChecked();
    });

    it("should update progress counter when answers selected", async () => {
      const user = userEvent.setup();
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText(/0\/2/i)).toBeInTheDocument();
      });

      const radioA = screen.getByRole("radio", { name: /option a/i });
      await user.click(radioA);

      await waitFor(() => {
        expect(screen.getByText(/1\/2/i)).toBeInTheDocument();
      });
    });
  });

  describe("Submit Button", () => {
    it("should be disabled when not all questions answered", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /submit final exam/i })).toBeDisabled();
      });
    });

    it("should be enabled when all questions answered", async () => {
      const user = userEvent.setup();
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      // Answer both questions
      await user.click(screen.getByRole("radio", { name: /option a/i }));
      await user.click(screen.getByRole("radio", { name: /rule 1/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /submit final exam/i })).not.toBeDisabled();
      });
    });

    it("should show confirmation dialog on submit", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("radio", { name: /option a/i }));
      await user.click(screen.getByRole("radio", { name: /rule 1/i }));

      await user.click(screen.getByRole("button", { name: /submit final exam/i }));

      expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining("Are you sure you want to submit your FINAL EXAM"));
    });
  });

  describe("Passed Results", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      vi.mocked(courseAPI.submitFinalExam).mockResolvedValue(mockPassedResults as any);

      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("radio", { name: /option a/i }));
      await user.click(screen.getByRole("radio", { name: /rule 1/i }));
      await user.click(screen.getByRole("button", { name: /submit final exam/i }));
    });

    it("should display congratulations message", async () => {
      await waitFor(() => {
        expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      });
    });

    it("should display score", async () => {
      await waitFor(() => {
        expect(screen.getByText("90%")).toBeInTheDocument();
      });

      expect(screen.getByText(/18 out of 20 correct/i)).toBeInTheDocument();
    });

    it("should display completion message", async () => {
      await waitFor(() => {
        expect(screen.getByText(/you have completed the course and earned your certificates/i)).toBeInTheDocument();
      });
    });

    it("should display certificate information", async () => {
      await waitFor(() => {
        const yourCertsHeadings = screen.getAllByText(/your certificates/i);
        expect(yourCertsHeadings.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Medical Interpreter")).toBeInTheDocument();
      expect(screen.getByText("HIPAA Compliance")).toBeInTheDocument();
      expect(screen.getByText("MIC-2024-001")).toBeInTheDocument();
      expect(screen.getByText("HIPAA-2024-001")).toBeInTheDocument();
    });

    it("should have view certificates button", async () => {
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /view full certificates/i })).toBeInTheDocument();
      });
    });

    it("should display detailed review", async () => {
      await waitFor(() => {
        expect(screen.getByText(/detailed review/i)).toBeInTheDocument();
      });
    });
  });

  describe("Failed Results", () => {
    it("should display failure message", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      vi.mocked(courseAPI.submitFinalExam).mockResolvedValue(mockFailedResults as any);

      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("radio", { name: /option a/i }));
      await user.click(screen.getByRole("radio", { name: /rule 1/i }));
      await user.click(screen.getByRole("button", { name: /submit final exam/i }));

      await waitFor(() => {
        expect(screen.getByText("Keep Trying!")).toBeInTheDocument();
      });
    });

    it("should display cooldown message", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      vi.mocked(courseAPI.submitFinalExam).mockResolvedValue(mockFailedResults as any);

      renderFinalExamView();

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("radio", { name: /option a/i }));
      await user.click(screen.getByRole("radio", { name: /rule 1/i }));
      await user.click(screen.getByRole("button", { name: /submit final exam/i }));

      await waitFor(() => {
        expect(screen.getByText(/wait 24 hours to retry/i)).toBeInTheDocument();
      });
    });
  });

  describe("API Calls", () => {
    it("should check access on mount", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(courseAPI.checkFinalExamAccess).toHaveBeenCalled();
      });
    });

    it("should fetch exam on mount", async () => {
      renderFinalExamView();

      await waitFor(() => {
        expect(courseAPI.getFinalExam).toHaveBeenCalledWith("course-1");
      });
    });
  });
});
