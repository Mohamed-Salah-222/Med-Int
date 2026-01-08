import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CourseDetail from "../CourseDetail";
import { AuthContext } from "../../context/AuthContext";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    getCourse: vi.fn(),
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

// Mock course data
const mockCourse = {
  course: {
    _id: "course-1",
    title: "Medical Interpreter Certification",
    chapters: [
      {
        _id: "chapter-1",
        title: "Introduction to Medical Interpreting",
        description: "Learn the basics",
        chapterNumber: 1,
        lessons: [
          { _id: "lesson-1", title: "What is Medical Interpreting", lessonNumber: 1 },
          { _id: "lesson-2", title: "Role of an Interpreter", lessonNumber: 2 },
        ],
      },
      {
        _id: "chapter-2",
        title: "HIPAA Compliance",
        description: "Learn about privacy",
        chapterNumber: 2,
        lessons: [{ _id: "lesson-3", title: "Understanding HIPAA", lessonNumber: 1 }],
      },
      {
        _id: "chapter-3",
        title: "Empty Chapter",
        description: "No lessons yet",
        chapterNumber: 3,
        lessons: [],
      },
    ],
  },
};

// Helper to render with AuthContext
const renderCourseDetail = (authValue: any = null) => {
  const defaultAuthValue = {
    user: null,
    token: null,
    login: vi.fn(),
    loginWithToken: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue || defaultAuthValue}>
        <CourseDetail />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("CourseDetail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(courseAPI.getCourse).mockResolvedValue({ data: mockCourse } as any);
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching course", () => {
      vi.mocked(courseAPI.getCourse).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderCourseDetail();

      expect(screen.getByText(/loading course details/i)).toBeInTheDocument();
    });
  });

  describe("Initial Render", () => {
    it("should render course title and description", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /medical interpreter certification course/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/master the skills needed to become a certified medical interpreter/i)).toBeInTheDocument();
    });

    it("should display course stats", async () => {
      renderCourseDetail();

      await waitFor(() => {
        const chaptersText = screen.getAllByText(/3 chapters/i);
        expect(chaptersText.length).toBeGreaterThan(0);
      });

      const certificatesText = screen.getAllByText(/2 certificates/i);
      expect(certificatesText.length).toBeGreaterThan(0);

      expect(screen.getByText(/self-paced/i)).toBeInTheDocument();
      expect(screen.getByText(/100% online/i)).toBeInTheDocument();
    });

    it("should fetch course data on mount", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(courseAPI.getCourse).toHaveBeenCalled();
      });
    });
  });

  describe("Enrollment - Not Logged In", () => {
    it('should show "Enroll Now" button when not logged in', async () => {
      renderCourseDetail();

      await waitFor(() => {
        const enrollButtons = screen.getAllByRole("button", { name: /enroll now/i });
        expect(enrollButtons.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to register when "Enroll Now" clicked', async () => {
      const user = userEvent.setup();
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /enroll now/i }).length).toBeGreaterThan(0);
      });

      const enrollButton = screen.getAllByRole("button", { name: /enroll now/i })[0];
      await user.click(enrollButton);

      expect(mockNavigate).toHaveBeenCalledWith("/register");
    });
  });

  describe("Enrollment - Logged In", () => {
    it('should show "Go to Dashboard" button when logged in', async () => {
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderCourseDetail(authValue);

      await waitFor(() => {
        const dashboardButtons = screen.getAllByRole("button", { name: /go to dashboard/i });
        expect(dashboardButtons.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to dashboard when "Go to Dashboard" clicked', async () => {
      const user = userEvent.setup();
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderCourseDetail(authValue);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /go to dashboard/i }).length).toBeGreaterThan(0);
      });

      const dashboardButton = screen.getAllByRole("button", { name: /go to dashboard/i })[0];
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("About Section", () => {
    it("should render about section with learning outcomes", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /about this course/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/the role and responsibilities of a medical interpreter/i)).toBeInTheDocument();
      expect(screen.getByText(/hipaa compliance and patient confidentiality/i)).toBeInTheDocument();
    });
  });

  describe("Chapter Accordion", () => {
    it("should render all chapters", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      // Use getAllByText for "HIPAA Compliance" since it appears in multiple places
      const hipaaText = screen.getAllByText(/hipaa compliance/i);
      expect(hipaaText.length).toBeGreaterThan(0);

      expect(screen.getByText(/empty chapter/i)).toBeInTheDocument();
    });

    it("should show lesson count for each chapter", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByText("2 lessons")).toBeInTheDocument();
      });

      expect(screen.getByText("1 lesson")).toBeInTheDocument();
      expect(screen.getByText("0 lessons")).toBeInTheDocument();
    });

    it("should expand chapter when clicked", async () => {
      const user = userEvent.setup();
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      // Initially lessons should not be visible
      expect(screen.queryByText(/lesson 1: what is medical interpreting/i)).not.toBeInTheDocument();

      // Click to expand
      const chapterButton = screen.getByRole("button", { name: /introduction to medical interpreting/i });
      await user.click(chapterButton);

      // Lessons should now be visible
      expect(screen.getByText(/lesson 1: what is medical interpreting/i)).toBeInTheDocument();
      expect(screen.getByText(/lesson 2: role of an interpreter/i)).toBeInTheDocument();
    });

    it("should collapse chapter when clicked again", async () => {
      const user = userEvent.setup();
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const chapterButton = screen.getByRole("button", { name: /introduction to medical interpreting/i });

      // Expand
      await user.click(chapterButton);
      expect(screen.getByText(/lesson 1: what is medical interpreting/i)).toBeInTheDocument();

      // Collapse
      await user.click(chapterButton);
      expect(screen.queryByText(/lesson 1: what is medical interpreting/i)).not.toBeInTheDocument();
    });

    it('should show "no lessons" message for empty chapters', async () => {
      const user = userEvent.setup();
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByText(/empty chapter/i)).toBeInTheDocument();
      });

      const emptyChapterButton = screen.getByRole("button", { name: /empty chapter/i });
      await user.click(emptyChapterButton);

      expect(screen.getByText(/no lessons available yet/i)).toBeInTheDocument();
    });
  });

  describe("Sidebar", () => {
    it("should render course includes section", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /course includes/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/interactive quizzes/i)).toBeInTheDocument();
      expect(screen.getByText(/lifetime access/i)).toBeInTheDocument();
    });

    it("should render career outlook section", async () => {
      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /career outlook/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/\$25-45\/hour/i)).toBeInTheDocument();
      expect(screen.getByText(/20% by 2031/i)).toBeInTheDocument();
      expect(screen.getByText(/ai-proof/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle API error gracefully", async () => {
      vi.mocked(courseAPI.getCourse).mockRejectedValue(new Error("API Error"));

      renderCourseDetail();

      await waitFor(() => {
        // Should stop loading even if error occurs
        expect(screen.queryByText(/loading course details/i)).not.toBeInTheDocument();
      });
    });

    it("should render page with no chapters if API returns empty", async () => {
      vi.mocked(courseAPI.getCourse).mockResolvedValue({
        data: { course: { chapters: [] } },
      } as any);

      renderCourseDetail();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /medical interpreter certification course/i })).toBeInTheDocument();
      });

      const chaptersText = screen.getAllByText(/0 chapters/i);
      expect(chaptersText.length).toBeGreaterThan(0);
    });
  });
});
