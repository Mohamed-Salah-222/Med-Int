import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LessonSidebar from "../LessonSidebar";

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("LessonSidebar", () => {
  const mockLessons = [
    { _id: "lesson-1", title: "Introduction to Medical Terms", lessonNumber: 1 },
    { _id: "lesson-2", title: "Basic Anatomy", lessonNumber: 2 },
    { _id: "lesson-3", title: "Common Procedures", lessonNumber: 3 },
  ];

  const defaultProps = {
    chapterTitle: "Medical Terminology Basics",
    chapterNumber: 1,
    chapterId: "chapter-1",
    lessons: mockLessons,
    currentLessonId: "lesson-1",
    completedLessonIds: [],
    userRole: "Student",
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("Initial Render - Closed State", () => {
    it("should render closed by default", () => {
      const { container } = renderWithRouter(<LessonSidebar {...defaultProps} />);

      // Toggle button should be visible
      expect(screen.getByRole("button", { name: /lesson sidebar/i })).toBeInTheDocument();

      // Sidebar should be hidden (translated off-screen)
      const sidebar = container.querySelector(".fixed.left-0.top-0");
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it('should show "Lessons" text when closed', () => {
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      expect(screen.getByText("Lessons")).toBeInTheDocument();
    });

    it("should open sidebar when toggle button clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Hide")).toBeInTheDocument();
      });
    });
  });

  describe("Initial Render - Open State", () => {
    it("should display chapter information", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("CHAPTER 1")).toBeInTheDocument();
        expect(screen.getByText("Medical Terminology Basics")).toBeInTheDocument();
      });
    });

    it("should display all lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Introduction to Medical Terms")).toBeInTheDocument();
        expect(screen.getByText("Basic Anatomy")).toBeInTheDocument();
        expect(screen.getByText("Common Procedures")).toBeInTheDocument();
      });
    });

    it("should display lesson numbers", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Lesson 1")).toBeInTheDocument();
        expect(screen.getByText("Lesson 2")).toBeInTheDocument();
        expect(screen.getByText("Lesson 3")).toBeInTheDocument();
      });
    });

    it("should close sidebar when toggle button clicked again", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      // Open
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText("Hide")).toBeInTheDocument();
      });

      // Close
      const hideButton = screen.getByRole("button", { name: /hide/i });
      await user.click(hideButton);

      await waitFor(() => {
        expect(screen.getByText("Lessons")).toBeInTheDocument();
      });
    });
  });

  describe("Current Lesson Highlighting", () => {
    it("should highlight the current lesson", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} currentLessonId="lesson-2" />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        expect(lesson2Button).toHaveClass("from-[#7A9D96]", "to-[#6A8D86]");
      });
    });

    it("should not highlight non-current lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} currentLessonId="lesson-1" />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        expect(lesson2Button).not.toHaveClass("from-[#7A9D96]");
      });
    });
  });

  describe("Completed Lessons", () => {
    it("should show checkmark for completed lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const lesson1 = screen.getByText("Introduction to Medical Terms").closest("button");
        // The CheckCircle icon from lucide-react renders as 'lucide-circle-check-big'
        const checkIcon = lesson1?.querySelector('[class*="lucide-circle-check"]');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("should show circle for incomplete lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson1 = screen.getByText("Introduction to Medical Terms").closest("button");
        const circle = lesson1?.querySelector(".rounded-full");
        expect(circle).toBeInTheDocument();
      });
    });
  });

  describe("Lesson Locking Logic", () => {
    it("should NOT lock first lesson", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson1Button = screen.getByText("Introduction to Medical Terms").closest("button");
        expect(lesson1Button).not.toBeDisabled();
      });
    });

    it("should lock second lesson if first is not completed", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        expect(lesson2Button).toBeDisabled();
        const lockIcon = lesson2Button?.querySelector(".lucide-lock");
        expect(lockIcon).toBeInTheDocument();
      });
    });

    it("should unlock second lesson if first is completed", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        expect(lesson2Button).not.toBeDisabled();
      });
    });

    it("should lock third lesson if second is not completed", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson3Button = screen.getByText("Common Procedures").closest("button");
        expect(lesson3Button).toBeDisabled();
      });
    });

    it("should unlock all lessons sequentially when completed", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1", "lesson-2"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson3Button = screen.getByText("Common Procedures").closest("button");
        expect(lesson3Button).not.toBeDisabled();
      });
    });
  });

  describe("Admin/SuperVisor Bypass", () => {
    it("should NOT lock any lessons for Admin", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} userRole="Admin" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        const lesson3Button = screen.getByText("Common Procedures").closest("button");

        expect(lesson2Button).not.toBeDisabled();
        expect(lesson3Button).not.toBeDisabled();
      });
    });

    it("should NOT lock any lessons for SuperVisor", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} userRole="SuperVisor" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        const lesson3Button = screen.getByText("Common Procedures").closest("button");

        expect(lesson2Button).not.toBeDisabled();
        expect(lesson3Button).not.toBeDisabled();
      });
    });

    it("should NOT show lock icons for Admin", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} userRole="Admin" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const lockIcons = screen.queryAllByTitle(/lock/i);
        expect(lockIcons.length).toBe(0);
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to lesson when unlocked lesson clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Introduction to Medical Terms")).toBeInTheDocument();
      });

      const lesson1Button = screen.getByText("Introduction to Medical Terms").closest("button");
      await user.click(lesson1Button!);

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-1");
    });

    it("should NOT navigate when locked lesson clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Basic Anatomy")).toBeInTheDocument();
      });

      const lesson2Button = screen.getByText("Basic Anatomy").closest("button");

      // Try to click locked lesson (should be disabled)
      await user.click(lesson2Button!);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should navigate to different lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1", "lesson-2"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Common Procedures")).toBeInTheDocument();
      });

      const lesson3Button = screen.getByText("Common Procedures").closest("button");
      await user.click(lesson3Button!);

      expect(mockNavigate).toHaveBeenCalledWith("/lesson/lesson-3");
    });
  });

  describe("Chapter Test", () => {
    it("should show locked chapter test when lessons incomplete", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Take Chapter 1 Test")).toBeInTheDocument();
        expect(screen.getByText("Complete all lessons first")).toBeInTheDocument();

        const chapterTestButton = screen.getByText("Take Chapter 1 Test").closest("button");
        expect(chapterTestButton).toBeDisabled();
      });
    });

    it("should unlock chapter test when all lessons completed", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1", "lesson-2", "lesson-3"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const chapterTestButton = screen.getByText("Take Chapter 1 Test").closest("button");
        expect(chapterTestButton).not.toBeDisabled();
      });
    });

    it("should navigate to chapter test when unlocked and clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1", "lesson-2", "lesson-3"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Take Chapter 1 Test")).toBeInTheDocument();
      });

      const chapterTestButton = screen.getByText("Take Chapter 1 Test").closest("button");
      await user.click(chapterTestButton!);

      expect(mockNavigate).toHaveBeenCalledWith("/chapter/chapter-1/test");
    });

    it("should NOT navigate to chapter test when locked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} completedLessonIds={["lesson-1"]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Take Chapter 1 Test")).toBeInTheDocument();
      });

      const chapterTestButton = screen.getByText("Take Chapter 1 Test").closest("button");
      await user.click(chapterTestButton!);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should unlock chapter test for Admin even without completed lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} userRole="Admin" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const chapterTestButton = screen.getByText("Take Chapter 1 Test").closest("button");
        expect(chapterTestButton).not.toBeDisabled();
      });
    });

    it("should unlock chapter test for SuperVisor even without completed lessons", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} userRole="SuperVisor" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const chapterTestButton = screen.getByText("Take Chapter 1 Test").closest("button");
        expect(chapterTestButton).not.toBeDisabled();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty lessons array", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} lessons={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Medical Terminology Basics")).toBeInTheDocument();
        // Chapter test should be visible even with no lessons
        expect(screen.getByText("Take Chapter 1 Test")).toBeInTheDocument();
      });
    });

    it("should handle missing userRole prop", async () => {
      const user = userEvent.setup();
      const propsWithoutRole = { ...defaultProps, userRole: undefined };

      renderWithRouter(<LessonSidebar {...propsWithoutRole} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        // Should treat as regular student (lessons locked)
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        expect(lesson2Button).toBeDisabled();
      });
    });

    it("should handle User role (not admin/supervisor)", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LessonSidebar {...defaultProps} userRole="User" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        // Should lock lessons like a student
        const lesson2Button = screen.getByText("Basic Anatomy").closest("button");
        expect(lesson2Button).toBeDisabled();
      });
    });

    it("should handle single lesson", async () => {
      const user = userEvent.setup();
      const singleLesson = [mockLessons[0]];

      renderWithRouter(<LessonSidebar {...defaultProps} lessons={singleLesson} currentLessonId="lesson-1" completedLessonIds={[]} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Introduction to Medical Terms")).toBeInTheDocument();
        const lesson1Button = screen.getByText("Introduction to Medical Terms").closest("button");
        expect(lesson1Button).not.toBeDisabled();
      });
    });
  });

  describe("Overlay", () => {
    it("should show overlay when sidebar is open", async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        const overlay = container.querySelector(".bg-black\\/30");
        expect(overlay).toBeInTheDocument();
      });
    });

    it("should close sidebar when overlay clicked", async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<LessonSidebar {...defaultProps} />);

      const toggleButton = screen.getByRole("button", { name: /lesson sidebar/i });
      // Toggle button is always first

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Hide")).toBeInTheDocument();
      });

      const overlay = container.querySelector(".bg-black\\/30") as HTMLElement;
      await user.click(overlay);

      await waitFor(() => {
        expect(screen.getByText("Lessons")).toBeInTheDocument();
      });
    });
  });
});
