import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChapterTestView from "../ChapterTestView";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    checkChapterTestAccess: vi.fn(),
    startChapterTest: vi.fn(),
    submitChapterTest: vi.fn(),
    abandonChapterTest: vi.fn(),
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

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock data
const mockAccessAllowed = {
  data: {
    canAccess: true,
  },
};

const mockTestData = {
  data: {
    sessionId: "session-123",
    test: {
      questions: [
        {
          _id: "q1",
          questionText: "What is medical interpretation?",
          options: ["Option A", "Option B", "Option C", "Option D"],
        },
        {
          _id: "q2",
          questionText: "What are the key principles?",
          options: ["Principle 1", "Principle 2", "Principle 3", "Principle 4"],
        },
      ],
    },
  },
};

const mockResults = {
  data: {
    score: 85,
    correctCount: 17,
    totalQuestions: 20,
    passed: true,
    passingScore: 70,
    results: [
      {
        questionId: "q1",
        questionText: "What is medical interpretation?",
        selectedAnswer: "Option A",
        correctAnswer: "Option A",
        isCorrect: true,
        explanation: "Correct! Medical interpretation involves...",
      },
      {
        questionId: "q2",
        questionText: "What are the key principles?",
        selectedAnswer: "Principle 2",
        correctAnswer: "Principle 1",
        isCorrect: false,
        explanation: "The correct principle is...",
      },
    ],
  },
};

// Helper to render with router and params
const renderChapterTestView = (chapterId = "chapter-1") => {
  return render(
    <MemoryRouter initialEntries={[`/test/chapter/${chapterId}`]}>
      <Routes>
        <Route path="/test/chapter/:id" element={<ChapterTestView />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ChapterTestView Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(courseAPI.checkChapterTestAccess).mockResolvedValue(mockAccessAllowed as any);
  });

  describe("Access Check", () => {
    it("should show loading while checking access", () => {
      vi.mocked(courseAPI.checkChapterTestAccess).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderChapterTestView();

      expect(screen.getByText(/checking access/i)).toBeInTheDocument();
    });

    it("should show locked message when access denied", async () => {
      vi.mocked(courseAPI.checkChapterTestAccess).mockRejectedValue({
        response: { data: { message: "Complete all lessons first" } },
      });

      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByText(/chapter test locked/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      expect(screen.getByText(/complete all lessons first/i)).toBeInTheDocument();
    });
  });

  describe("Start Screen", () => {
    it("should display test instructions", async () => {
      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByText("Chapter Test")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      expect(screen.getByText(/ready to test your knowledge/i)).toBeInTheDocument();
    });

    it("should display important rules", async () => {
      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByText(/important rules/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      expect(screen.getByText(/1 minute per question/i)).toBeInTheDocument();
    });

    it("should have start test button", async () => {
      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: /start chapter test/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe("Starting Test", () => {
    it("should start test when button clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.startChapterTest).mockResolvedValue(mockTestData as any);

      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: /start chapter test/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await user.click(screen.getByRole("button", { name: /start chapter test/i }));

      await waitFor(
        () => {
          expect(courseAPI.startChapterTest).toHaveBeenCalledWith("chapter-1");
        },
        { timeout: 10000 }
      );
    });

    it("should show first question after starting", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.startChapterTest).mockResolvedValue(mockTestData as any);

      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: /start chapter test/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await user.click(screen.getByRole("button", { name: /start chapter test/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/what is medical interpretation/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe("Test In Progress", () => {
    it("should display question progress", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.startChapterTest).mockResolvedValue(mockTestData as any);

      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: /start chapter test/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await user.click(screen.getByRole("button", { name: /start chapter test/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/question 1\/2/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it("should display answer options", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.startChapterTest).mockResolvedValue(mockTestData as any);

      renderChapterTestView();

      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: /start chapter test/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await user.click(screen.getByRole("button", { name: /start chapter test/i }));

      await waitFor(
        () => {
          expect(screen.getByText("Option A")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      expect(screen.getByText("Option B")).toBeInTheDocument();
      expect(screen.getByText("Option C")).toBeInTheDocument();
      expect(screen.getByText("Option D")).toBeInTheDocument();
    });
  });

  describe("API Calls", () => {
    it("should check access on mount", async () => {
      renderChapterTestView();

      await waitFor(
        () => {
          expect(courseAPI.checkChapterTestAccess).toHaveBeenCalledWith("chapter-1");
        },
        { timeout: 10000 }
      );
    });
  });
});
