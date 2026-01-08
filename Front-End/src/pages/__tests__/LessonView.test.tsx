import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LessonView from "../LessonView";
import { AuthContext } from "../../context/AuthContext";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    getLesson: vi.fn(),
    checkLessonAccess: vi.fn(),
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

// Mock LessonSidebar
vi.mock("../../components/LessonSidebar", () => ({
  default: () => <div data-testid="lesson-sidebar">Sidebar</div>,
}));

// Mock LessonChatbot
vi.mock("../../components/LessonChatbot", () => ({
  default: () => <div data-testid="lesson-chatbot">Chatbot</div>,
}));

// Mock lesson data
const mockLessonData = {
  data: {
    lesson: {
      id: "lesson-1",
      lessonNumber: 1,
      title: "Introduction to Medical Terminology",
      content: "<h2>Welcome to Lesson 1</h2><p>This lesson covers basic medical terminology.</p>",
    },
    chapter: {
      id: "chapter-1",
      title: "Medical Basics",
      chapterNumber: 1,
      lessons: [
        { id: "lesson-1", lessonNumber: 1, title: "Introduction to Medical Terminology", completed: false },
        { id: "lesson-2", lessonNumber: 2, title: "Common Medical Terms", completed: false },
      ],
    },
  },
};

const mockProgressData = {
  data: {
    progress: {
      chapters: [
        {
          chapterId: "chapter-1",
          lessons: [
            { lessonId: "lesson-1", completed: true },
            { lessonId: "lesson-2", completed: false },
          ],
        },
      ],
    },
  },
};

// Helper to render with router and auth
const renderLessonView = (lessonId: string = "lesson-1", authValue: any = null) => {
  const defaultAuthValue = {
    user: { name: "John Doe", role: "Student" },
    token: "test-token",
    login: vi.fn(),
    loginWithToken: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  return render(
    <MemoryRouter initialEntries={[`/lesson/${lessonId}`]}>
      <AuthContext.Provider value={authValue || defaultAuthValue}>
        <Routes>
          <Route path="/lesson/:id" element={<LessonView />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("LessonView Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Default successful mocks
    vi.mocked(courseAPI.getLesson).mockResolvedValue(mockLessonData as any);
    vi.mocked(courseAPI.checkLessonAccess).mockResolvedValue({ data: { canAccess: true } } as any);
    vi.mocked(courseAPI.getDetailedProgress).mockResolvedValue(mockProgressData as any);
  });

  describe("Loading States", () => {
    it("should show loading spinner while fetching lesson", () => {
      vi.mocked(courseAPI.getLesson).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(courseAPI.checkLessonAccess).mockResolvedValue({ data: { canAccess: true } } as any);

      renderLessonView();

      expect(screen.getByText(/loading lesson/i)).toBeInTheDocument();
    });
  });

  describe("Access Control", () => {
    it("should show locked message when access denied", async () => {
      vi.mocked(courseAPI.checkLessonAccess).mockRejectedValue({
        response: { data: { message: "Complete previous lesson first" } },
      });

      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/lesson locked/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/complete previous lesson first/i)).toBeInTheDocument();
    });

    it("should show generic access denied message when no specific message", async () => {
      vi.mocked(courseAPI.checkLessonAccess).mockRejectedValue({
        response: {},
      });

      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });

    it("should navigate to dashboard when clicking back button on locked lesson", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.checkLessonAccess).mockRejectedValue({
        response: { data: { message: "Lesson locked" } },
      });

      renderLessonView();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /back to dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Lesson Not Found", () => {
    it("should show error when lesson not found", async () => {
      vi.mocked(courseAPI.getLesson).mockResolvedValue({ data: { lesson: null } } as any);

      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/lesson not found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Successful Lesson Load", () => {
    it("should render lesson title and content", async () => {
      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical terminology/i)).toBeInTheDocument();
      });

      // "Lesson 1" appears multiple times, just verify it exists
      const lessonText = screen.getAllByText(/lesson 1/i);
      expect(lessonText.length).toBeGreaterThan(0);

      expect(screen.getByText(/welcome to lesson 1/i)).toBeInTheDocument();
    });

    it("should call all required APIs on mount", async () => {
      renderLessonView();

      await waitFor(() => {
        expect(courseAPI.getLesson).toHaveBeenCalledWith("lesson-1");
        expect(courseAPI.checkLessonAccess).toHaveBeenCalledWith("lesson-1");
      });

      // Wait for progress API call (happens after chapter info loads)
      await waitFor(() => {
        expect(courseAPI.getDetailedProgress).toHaveBeenCalled();
      });
    });

    it("should render sidebar when chapter info available", async () => {
      renderLessonView();

      await waitFor(() => {
        expect(screen.getByTestId("lesson-sidebar")).toBeInTheDocument();
      });
    });

    it("should render chatbot", async () => {
      renderLessonView();

      await waitFor(() => {
        expect(screen.getByTestId("lesson-chatbot")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to dashboard when clicking back to dashboard", async () => {
      const user = userEvent.setup();
      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical terminology/i)).toBeInTheDocument();
      });

      const backButtons = screen.getAllByRole("button", { name: /dashboard/i });
      await user.click(backButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should navigate to quiz when clicking take quiz button", async () => {
      const user = userEvent.setup();
      renderLessonView();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /take quiz/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /take quiz/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-1/quiz");
    });
  });

  describe("Progress Tracking", () => {
    it("should fetch progress data when chapter info available", async () => {
      renderLessonView();

      await waitFor(() => {
        expect(courseAPI.getDetailedProgress).toHaveBeenCalled();
      });
    });

    it("should handle progress fetch errors gracefully", async () => {
      vi.mocked(courseAPI.getDetailedProgress).mockRejectedValue(new Error("Progress error"));

      renderLessonView();

      // Should still render the lesson even if progress fails
      await waitFor(() => {
        expect(screen.getByText(/introduction to medical terminology/i)).toBeInTheDocument();
      });
    });
  });

  describe("Different User Roles", () => {
    it("should allow admin to access any lesson", async () => {
      const adminAuth = {
        user: { name: "Admin User", role: "Admin" },
        token: "admin-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLessonView("lesson-1", adminAuth);

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical terminology/i)).toBeInTheDocument();
      });
    });

    it("should allow supervisor to access any lesson", async () => {
      const supervisorAuth = {
        user: { name: "Supervisor User", role: "SuperVisor" },
        token: "supervisor-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLessonView("lesson-1", supervisorAuth);

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical terminology/i)).toBeInTheDocument();
      });
    });
  });

  describe("HTML Content Rendering", () => {
    it("should render HTML content using dangerouslySetInnerHTML", async () => {
      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/welcome to lesson 1/i)).toBeInTheDocument();
      });

      // Check that HTML is actually rendered (h2 tag)
      const heading = screen.getByText(/welcome to lesson 1/i);
      expect(heading.tagName).toBe("H2");
    });
  });

  describe("Error Handling", () => {
    it("should handle lesson fetch error", async () => {
      vi.mocked(courseAPI.getLesson).mockRejectedValue(new Error("Fetch error"));

      renderLessonView();

      await waitFor(() => {
        expect(screen.getByText(/lesson not found/i)).toBeInTheDocument();
      });
    });
  });
});
