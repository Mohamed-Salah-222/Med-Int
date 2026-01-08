import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import QuizView from "../QuizView";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    getLessonQuiz: vi.fn(),
    submitQuiz: vi.fn(),
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock quiz data
const mockQuizData = {
  data: {
    quiz: {
      questions: [
        {
          _id: "q1",
          questionText: "What is HIPAA?",
          options: ["Health Insurance Portability Act", "Hospital Information Privacy Act", "Healthcare Insurance Protection Act", "None of the above"],
        },
        {
          _id: "q2",
          questionText: "What does PHI stand for?",
          options: ["Protected Health Information", "Personal Health Insurance", "Private Hospital Info", "Public Health Initiative"],
        },
        {
          _id: "q3",
          questionText: "Who enforces HIPAA?",
          options: ["Department of Health and Human Services", "FBI", "CDC", "WHO"],
        },
      ],
      passingScore: 80,
    },
  },
};

// Mock passed quiz results
const mockPassedResults = {
  data: {
    passed: true,
    score: 100,
    correctCount: 3,
    totalQuestions: 3,
    results: [
      {
        questionId: "q1",
        questionText: "What is HIPAA?",
        selectedAnswer: "Health Insurance Portability Act",
        correctAnswer: "Health Insurance Portability Act",
        isCorrect: true,
        explanation: "HIPAA stands for Health Insurance Portability and Accountability Act.",
      },
      {
        questionId: "q2",
        questionText: "What does PHI stand for?",
        selectedAnswer: "Protected Health Information",
        correctAnswer: "Protected Health Information",
        isCorrect: true,
      },
      {
        questionId: "q3",
        questionText: "Who enforces HIPAA?",
        selectedAnswer: "Department of Health and Human Services",
        correctAnswer: "Department of Health and Human Services",
        isCorrect: true,
      },
    ],
    nextLessonId: "lesson-2",
  },
};

// Mock failed quiz results
const mockFailedResults = {
  data: {
    passed: false,
    score: 33,
    correctCount: 1,
    totalQuestions: 3,
    results: [
      {
        questionId: "q1",
        questionText: "What is HIPAA?",
        selectedAnswer: "Hospital Information Privacy Act",
        correctAnswer: "Health Insurance Portability Act",
        isCorrect: false,
        explanation: "HIPAA stands for Health Insurance Portability and Accountability Act.",
      },
      {
        questionId: "q2",
        questionText: "What does PHI stand for?",
        selectedAnswer: "Protected Health Information",
        correctAnswer: "Protected Health Information",
        isCorrect: true,
      },
      {
        questionId: "q3",
        questionText: "Who enforces HIPAA?",
        selectedAnswer: "FBI",
        correctAnswer: "Department of Health and Human Services",
        isCorrect: false,
      },
    ],
  },
};

// Helper to render with router
const renderQuizView = (lessonId: string = "lesson-1") => {
  return render(
    <MemoryRouter initialEntries={[`/lesson/${lessonId}/quiz`]}>
      <Routes>
        <Route path="/lesson/:id/quiz" element={<QuizView />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("QuizView Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(courseAPI.getLessonQuiz).mockResolvedValue(mockQuizData as any);
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching quiz", () => {
      vi.mocked(courseAPI.getLessonQuiz).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderQuizView();

      expect(screen.getByText(/loading quiz/i)).toBeInTheDocument();
    });
  });

  describe("Initial Render", () => {
    it("should render quiz header and instructions", async () => {
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/lesson quiz/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/test your understanding/i)).toBeInTheDocument();
      expect(screen.getByText(/quiz instructions/i)).toBeInTheDocument();
    });

    it("should display question count and passing score", async () => {
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/3 questions/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/80% to pass/i)).toBeInTheDocument();
      expect(screen.getByText(/unlimited retries/i)).toBeInTheDocument();
    });

    it("should render all questions", async () => {
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/what does phi stand for\?/i)).toBeInTheDocument();
      expect(screen.getByText(/who enforces hipaa\?/i)).toBeInTheDocument();
    });

    it("should show answered count as 0/3 initially", async () => {
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText("0/3")).toBeInTheDocument();
      });

      expect(screen.getByText(/answered/i)).toBeInTheDocument();
    });

    it("should disable submit button initially", async () => {
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /submit quiz/i })).toBeDisabled();
      });
    });
  });

  describe("Answering Questions", () => {
    it("should update answer when option selected", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      const option = screen.getByLabelText(/health insurance portability act/i);
      await user.click(option);

      expect(option).toBeChecked();
    });

    it("should update answered count when answering questions", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText("0/3")).toBeInTheDocument();
      });

      // Answer first question
      await user.click(screen.getByLabelText(/health insurance portability act/i));

      expect(screen.getByText("1/3")).toBeInTheDocument();

      // Answer second question
      await user.click(screen.getByLabelText(/protected health information/i));

      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    it("should show ANSWERED badge for completed questions", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      // Initially no ANSWERED badges
      expect(screen.queryByText("ANSWERED")).not.toBeInTheDocument();

      // Answer first question
      await user.click(screen.getByLabelText(/health insurance portability act/i));

      // Should show ANSWERED badge
      expect(screen.getByText("ANSWERED")).toBeInTheDocument();
    });

    it("should update progress bar as questions are answered", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/0% complete/i)).toBeInTheDocument();
      });

      // Answer first question
      await user.click(screen.getByLabelText(/health insurance portability act/i));

      expect(screen.getByText(/33% complete/i)).toBeInTheDocument();
    });

    it("should enable submit button when at least one question answered", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /submit quiz/i })).toBeDisabled();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));

      expect(screen.getByRole("button", { name: /submit quiz/i })).toBeEnabled();
    });
  });

  describe("Incomplete Submission", () => {
    it("should show incomplete modal when submitting with unanswered questions", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      // Answer only 2 out of 3 questions
      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));

      expect(screen.getByText(/quiz incomplete/i)).toBeInTheDocument();
      expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument();
    });

    it("should show which questions are unanswered", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      // Answer only first question
      await user.click(screen.getByLabelText(/health insurance portability act/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));

      expect(screen.getByText(/unanswered questions:/i)).toBeInTheDocument();
      expect(screen.getByText("Q2")).toBeInTheDocument();
      expect(screen.getByText("Q3")).toBeInTheDocument();
    });

    it("should close incomplete modal when clicking got it", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByRole("button", { name: /submit quiz/i }));

      expect(screen.getByText(/quiz incomplete/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /got it!/i }));

      expect(screen.queryByText(/quiz incomplete/i)).not.toBeInTheDocument();
    });
  });

  describe("Submit Confirmation Modal", () => {
    it("should show confirmation modal when all questions answered", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      // Answer all questions
      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));

      expect(screen.getByText(/submit quiz\?/i)).toBeInTheDocument();
      expect(screen.getByText(/you've answered all 3 questions/i)).toBeInTheDocument();
    });

    it("should close confirmation modal when clicking cancel", async () => {
      const user = userEvent.setup();
      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      // Answer all questions
      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText(/submit quiz\?/i)).not.toBeInTheDocument();
    });
  });

  describe("Quiz Submission", () => {
    it("should submit quiz with correct answers format", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockPassedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      // Answer all questions
      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(courseAPI.submitQuiz).toHaveBeenCalledWith("lesson-1", [
          { questionId: "q1", selectedAnswer: "Health Insurance Portability Act" },
          { questionId: "q2", selectedAnswer: "Protected Health Information" },
          { questionId: "q3", selectedAnswer: "Department of Health and Human Services" },
        ]);
      });
    });

    it("should show submitting state", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockPassedResults as any), 1000)));

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });
  });

  describe("Passed Quiz Results", () => {
    it("should show passed results", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockPassedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByText(/quiz passed/i)).toBeInTheDocument();
      });

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText(/3 out of 3 correct/i)).toBeInTheDocument();
    });

    it("should show next lesson button when available", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockPassedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /continue to next lesson/i })).toBeInTheDocument();
      });
    });

    it("should navigate to next lesson when button clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockPassedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /continue to next lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /continue to next lesson/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-2");
    });

    it("should show course complete button when no next lesson", async () => {
      const user = userEvent.setup();
      const resultsWithoutNext = {
        ...mockPassedResults,
        data: { ...mockPassedResults.data, nextLessonId: null },
      };
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(resultsWithoutNext as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /course complete!/i })).toBeInTheDocument();
      });
    });
  });

  describe("Failed Quiz Results", () => {
    it("should show failed results", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockFailedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/hospital information privacy act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/fbi/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByText(/keep practicing/i)).toBeInTheDocument();
      });

      expect(screen.getByText("33%")).toBeInTheDocument();
      expect(screen.getByText(/1 out of 3 correct/i)).toBeInTheDocument();
    });

    it("should show retry button when failed", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockFailedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/hospital information privacy act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/fbi/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry quiz/i })).toBeInTheDocument();
      });
    });

    it("should show correct and incorrect answers in results", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockFailedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/hospital information privacy act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/fbi/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByText(/detailed review/i)).toBeInTheDocument();
      });

      // Should show correct and incorrect badges
      const correctBadges = screen.getAllByText("Correct");
      const incorrectBadges = screen.getAllByText("Incorrect");

      expect(correctBadges.length).toBe(1);
      expect(incorrectBadges.length).toBe(2);
    });
  });

  describe("Navigation from Results", () => {
    it("should navigate to dashboard when clicking back button", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.submitQuiz).mockResolvedValue(mockPassedResults as any);

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(screen.getByText(/quiz passed/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /back to dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Error Handling", () => {
    it("should handle quiz submission error", async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.mocked(courseAPI.submitQuiz).mockRejectedValue(new Error("Submit error"));

      renderQuizView();

      await waitFor(() => {
        expect(screen.getByText(/what is hipaa\?/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/health insurance portability act/i));
      await user.click(screen.getByLabelText(/protected health information/i));
      await user.click(screen.getByLabelText(/department of health and human services/i));

      await user.click(screen.getByRole("button", { name: /submit quiz/i }));
      await user.click(screen.getByRole("button", { name: /submit now/i }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to submit quiz. Please try again.");
      });

      alertSpy.mockRestore();
    });
  });
});
