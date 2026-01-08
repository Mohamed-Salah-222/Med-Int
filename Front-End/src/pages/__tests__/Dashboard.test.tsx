import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../Dashboard";
import { AuthContext } from "../../context/AuthContext";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    getDetailedProgress: vi.fn(),
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

// Mock progress data
const mockProgressData = {
  progress: {
    courseCompleted: false,
    certificateIssued: false,
    currentChapter: 2,
    nextAction: {
      type: "lesson",
      message: "Continue with Lesson 2 in Chapter 2",
      chapterNumber: 2,
      lessonNumber: 2,
    },
    chapters: [
      {
        chapterId: "chapter-1",
        chapterNumber: 1,
        title: "Introduction to Medical Interpreting",
        totalLessons: 3,
        completedLessons: 3,
        allLessonsCompleted: true,
        testPassed: true,
        testScore: 85,
        lessons: [
          { lessonId: "lesson-1", lessonNumber: 1, title: "What is Medical Interpreting", completed: true, attempts: 2, quizScore: 5 },
          { lessonId: "lesson-2", lessonNumber: 2, title: "Role of an Interpreter", completed: true, attempts: 1, quizScore: 4 },
          { lessonId: "lesson-3", lessonNumber: 3, title: "Ethics in Interpreting", completed: true, attempts: 1, quizScore: 5 },
        ],
      },
      {
        chapterId: "chapter-2",
        chapterNumber: 2,
        title: "HIPAA Compliance",
        totalLessons: 2,
        completedLessons: 1,
        allLessonsCompleted: false,
        testPassed: false,
        testScore: null,
        lessons: [
          { lessonId: "lesson-4", lessonNumber: 1, title: "Understanding HIPAA", completed: true, attempts: 1, quizScore: 5 },
          { lessonId: "lesson-5", lessonNumber: 2, title: "Privacy Rules", completed: false, attempts: 0, quizScore: null },
        ],
      },
    ],
    finalExam: {
      attempts: [],
      bestScore: null,
      passed: false,
    },
  },
};

// Helper to render with AuthContext
const renderDashboard = (authValue: any = null, progressData: any = mockProgressData) => {
  const defaultAuthValue = {
    user: { name: "John Doe", role: "Student" },
    token: "test-token",
    login: vi.fn(),
    loginWithToken: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  vi.mocked(courseAPI.getDetailedProgress).mockResolvedValue({ data: progressData } as any);

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue || defaultAuthValue}>
        <Dashboard />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching progress", () => {
      vi.mocked(courseAPI.getDetailedProgress).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderDashboard();

      expect(screen.getByText(/loading your progress/i)).toBeInTheDocument();
    });
  });

  describe("Initial Render", () => {
    it("should render welcome message with user name", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/welcome back, john doe!/i)).toBeInTheDocument();
      });
    });

    it("should fetch progress data on mount", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(courseAPI.getDetailedProgress).toHaveBeenCalled();
      });
    });
  });

  describe("Stats Cards", () => {
    it("should display current chapter", async () => {
      renderDashboard();

      await waitFor(() => {
        const chapterNumbers = screen.getAllByText("2");
        expect(chapterNumbers.length).toBeGreaterThan(0);
        expect(screen.getByText(/current chapter/i)).toBeInTheDocument();
      });
    });

    it("should display lessons progress", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("4/5")).toBeInTheDocument();
        expect(screen.getByText(/lessons complete/i)).toBeInTheDocument();
      });
    });

    it("should display chapters progress", async () => {
      renderDashboard();

      await waitFor(() => {
        const progressText = screen.getAllByText("1/2");
        expect(progressText.length).toBeGreaterThan(0);
        // Just verify 1/2 exists, don't check for the text that appears multiple times
      });
    });

    it("should display course status as active", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getByText(/course status/i)).toBeInTheDocument();
      });
    });

    it("should display course status as complete when finished", async () => {
      const completedProgress = {
        progress: {
          ...mockProgressData.progress,
          courseCompleted: true,
        },
      };

      renderDashboard(null, completedProgress);

      await waitFor(() => {
        expect(screen.getByText(/course status/i)).toBeInTheDocument();
        const completeText = screen.getAllByText("Complete");
        expect(completeText.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Progress Bars", () => {
    it("should display lesson progress percentage", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/lesson progress/i)).toBeInTheDocument();
        expect(screen.getByText("80%")).toBeInTheDocument(); // 4/5 = 80%
      });
    });

    it("should display chapter progress percentage", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/chapter progress/i)).toBeInTheDocument();
        expect(screen.getByText("50%")).toBeInTheDocument(); // 1/2 = 50%
      });
    });
  });

  describe("Next Action Card", () => {
    it("should display next action for lesson", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("Your Next Step")).toBeInTheDocument();
        expect(screen.getByText(/continue with lesson 2/i)).toBeInTheDocument();
      });
    });

    it('should navigate to lesson when "Start Lesson" clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /start lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /start lesson/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-5");
    });

    it("should display next action for chapter test", async () => {
      const chapterTestProgress = {
        progress: {
          ...mockProgressData.progress,
          nextAction: {
            type: "chapter-test",
            message: "Ready to take Chapter 2 test",
            chapterNumber: 2,
          },
        },
      };

      renderDashboard(null, chapterTestProgress);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /take chapter test/i })).toBeInTheDocument();
      });
    });

    it("should navigate to chapter test when clicked", async () => {
      const user = userEvent.setup();
      const chapterTestProgress = {
        progress: {
          ...mockProgressData.progress,
          nextAction: {
            type: "chapter-test",
            message: "Ready to take Chapter 2 test",
            chapterNumber: 2,
          },
        },
      };

      renderDashboard(null, chapterTestProgress);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /take chapter test/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /take chapter test/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/chapter/chapter-2/test");
    });

    it("should display next action for final exam", async () => {
      const finalExamProgress = {
        progress: {
          ...mockProgressData.progress,
          nextAction: {
            type: "final-exam",
            message: "Ready to take the final exam",
          },
        },
      };

      renderDashboard(null, finalExamProgress);

      await waitFor(() => {
        expect(screen.getByText(/take final exam/i)).toBeInTheDocument();
      });
    });

    it("should display completed action", async () => {
      const completedProgress = {
        progress: {
          ...mockProgressData.progress,
          nextAction: {
            type: "completed",
            message: "Course completed!",
          },
        },
      };

      renderDashboard(null, completedProgress);

      await waitFor(() => {
        expect(screen.getByText(/view your certificates/i)).toBeInTheDocument();
      });
    });
  });

  describe("Certificate Banner", () => {
    it("should show certificate banner when course completed", async () => {
      const completedProgress = {
        progress: {
          ...mockProgressData.progress,
          courseCompleted: true,
          certificateIssued: true,
        },
      };

      renderDashboard(null, completedProgress);

      await waitFor(() => {
        expect(screen.getByText(/congratulations!/i)).toBeInTheDocument();
        expect(screen.getByText(/you've completed the course/i)).toBeInTheDocument();
      });
    });

    it("should not show certificate banner when course not completed", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.queryByText(/congratulations!/i)).not.toBeInTheDocument();
      });
    });

    it("should navigate to certificates when button clicked", async () => {
      const user = userEvent.setup();
      const completedProgress = {
        progress: {
          ...mockProgressData.progress,
          courseCompleted: true,
          certificateIssued: true,
        },
      };

      renderDashboard(null, completedProgress);

      await waitFor(() => {
        const certificateButtons = screen.getAllByRole("button", { name: /view certificates/i });
        expect(certificateButtons.length).toBeGreaterThan(0);
      });

      const certificateButtons = screen.getAllByRole("button", { name: /view certificates/i });
      await user.click(certificateButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/certificate/"));
    });
  });

  describe("Chapter Accordion", () => {
    it("should render all chapters", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/hipaa compliance/i)).toBeInTheDocument();
    });

    it("should show chapter completion status", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/test passed/i)).toBeInTheDocument();
      });
    });

    it("should auto-expand current chapter on load", async () => {
      renderDashboard();

      await waitFor(() => {
        // Chapter 2 should be expanded (first incomplete chapter)
        expect(screen.getByText(/understanding hipaa/i)).toBeInTheDocument();
      });
    });

    it("should expand chapter when clicked", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      // Initially Chapter 1 lessons should not be visible
      expect(screen.queryByText(/what is medical interpreting/i)).not.toBeInTheDocument();

      // Click to expand Chapter 1
      const chapterButton = screen.getByRole("button", { name: /introduction to medical interpreting/i });
      await user.click(chapterButton);

      // Lessons should now be visible
      expect(screen.getByText(/what is medical interpreting/i)).toBeInTheDocument();
    });

    it("should collapse chapter when clicked again", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        // Chapter 2 is auto-expanded
        expect(screen.getByText(/understanding hipaa/i)).toBeInTheDocument();
      });

      // Click to collapse
      const chapterButton = screen.getByRole("button", { name: /hipaa compliance/i });
      await user.click(chapterButton);

      // Lessons should be hidden
      expect(screen.queryByText(/understanding hipaa/i)).not.toBeInTheDocument();
    });
  });

  describe("Lesson Navigation", () => {
    it("should navigate to lesson when clicked", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/understanding hipaa/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/understanding hipaa/i));

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-4");
    });

    it("should show quiz score for completed lessons", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      // Expand Chapter 1
      await user.click(screen.getByRole("button", { name: /introduction to medical interpreting/i }));

      // Check for quiz scores (multiple lessons have 5/5)
      const scores = screen.getAllByText("5/5");
      expect(scores.length).toBeGreaterThan(0);
    });

    it("should show attempt count for completed lessons", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      // Expand Chapter 1
      await user.click(screen.getByRole("button", { name: /introduction to medical interpreting/i }));

      // Check for attempts
      expect(screen.getByText(/2 attempts/i)).toBeInTheDocument();
    });
  });

  describe("Admin/Supervisor Bypass", () => {
    it("should allow admin to access locked lessons", async () => {
      const adminAuth = {
        user: { name: "Admin User", role: "Admin" },
        token: "admin-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      const user = userEvent.setup();
      renderDashboard(adminAuth);

      await waitFor(() => {
        expect(screen.getByText(/privacy rules/i)).toBeInTheDocument();
      });

      // Lesson should not be locked for admin
      expect(screen.queryByText(/complete previous lesson first/i)).not.toBeInTheDocument();

      await user.click(screen.getByText(/privacy rules/i));

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-5");
    });

    it("should allow supervisor to access chapter tests without completing lessons", async () => {
      const supervisorAuth = {
        user: { name: "Supervisor User", role: "SuperVisor" },
        token: "supervisor-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderDashboard(supervisorAuth);

      await waitFor(() => {
        expect(screen.getByText(/hipaa compliance/i)).toBeInTheDocument();
      });

      // Chapter test button should be available even though not all lessons are complete
      const testButtons = screen.getAllByRole("button", { name: /take chapter test/i });
      expect(testButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Chapter Test Button", () => {
    it("should show locked state when lessons incomplete", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/complete all lessons to unlock test/i)).toBeInTheDocument();
      });
    });

    it("should show test button when all lessons complete", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      // Expand Chapter 1 (all lessons complete)
      await user.click(screen.getByRole("button", { name: /introduction to medical interpreting/i }));

      // Test should show as passed
      expect(screen.getByText(/test passed \(85%\)/i)).toBeInTheDocument();
    });

    it("should navigate to chapter test when clicked", async () => {
      const allLessonsComplete = {
        progress: {
          ...mockProgressData.progress,
          chapters: [
            ...mockProgressData.progress.chapters.slice(0, 1),
            {
              ...mockProgressData.progress.chapters[1],
              allLessonsCompleted: true,
              lessons: [{ ...mockProgressData.progress.chapters[1].lessons[0] }, { ...mockProgressData.progress.chapters[1].lessons[1], completed: true }],
            },
          ],
        },
      };

      const user = userEvent.setup();
      renderDashboard(null, allLessonsComplete);

      await waitFor(() => {
        const testButtons = screen.getAllByRole("button", { name: /take chapter test/i });
        expect(testButtons.length).toBeGreaterThan(0);
      });

      const testButtons = screen.getAllByRole("button", { name: /take chapter test/i });
      await user.click(testButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/chapter/chapter-2/test");
    });
  });

  describe("Final Exam Section", () => {
    it("should show locked state when not all chapters passed", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/final exam locked/i)).toBeInTheDocument();
        expect(screen.getByText(/pass all chapter tests/i)).toBeInTheDocument();
      });
    });

    it("should show progress toward unlocking final exam", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/progress:/i)).toBeInTheDocument();
        const progressText = screen.getAllByText("1/2");
        expect(progressText.length).toBeGreaterThan(0);
        expect(screen.getByText(/chapters completed/i)).toBeInTheDocument();
      });
    });

    it("should show final exam ready when all chapters passed", async () => {
      const allChaptersPassed = {
        progress: {
          ...mockProgressData.progress,
          chapters: mockProgressData.progress.chapters.map((ch) => ({
            ...ch,
            testPassed: true,
          })),
        },
      };

      renderDashboard(null, allChaptersPassed);

      await waitFor(() => {
        expect(screen.getByText(/final exam ready!/i)).toBeInTheDocument();
      });
    });

    it("should navigate to final exam when button clicked", async () => {
      const user = userEvent.setup();
      const allChaptersPassed = {
        progress: {
          ...mockProgressData.progress,
          chapters: mockProgressData.progress.chapters.map((ch) => ({
            ...ch,
            testPassed: true,
          })),
        },
      };

      renderDashboard(null, allChaptersPassed);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /take final exam/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /take final exam/i }));

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/exam"));
    });

    it("should show final exam attempt history", async () => {
      const withAttempts = {
        progress: {
          ...mockProgressData.progress,
          chapters: mockProgressData.progress.chapters.map((ch) => ({
            ...ch,
            testPassed: true,
          })),
          finalExam: {
            attempts: [{ score: 75 }, { score: 82 }],
            bestScore: 82,
            passed: false,
          },
        },
      };

      renderDashboard(null, withAttempts);

      await waitFor(() => {
        const scoreText = screen.getAllByText("82%");
        expect(scoreText.length).toBeGreaterThan(0);

        const attemptsText = screen.getAllByText("2");
        expect(attemptsText.length).toBeGreaterThan(0);
      });
    });

    it("should not show final exam section when course completed", async () => {
      const completed = {
        progress: {
          ...mockProgressData.progress,
          courseCompleted: true,
          chapters: mockProgressData.progress.chapters.map((ch) => ({
            ...ch,
            testPassed: true,
          })),
        },
      };

      renderDashboard(null, completed);

      await waitFor(() => {
        expect(screen.queryByText(/final exam locked/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/final exam ready/i)).not.toBeInTheDocument();
      });
    });
  });
});
