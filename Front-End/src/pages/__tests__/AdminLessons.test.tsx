import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminLessons from "../AdminLessons";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getAllCourses: vi.fn(),
    getAllChapters: vi.fn(),
    getAllLessons: vi.fn(),
    getLessonById: vi.fn(),
    createLesson: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
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
const mockCoursesData = {
  data: {
    courses: [
      { id: "course-1", title: "Medical Interpreter Training" },
      { id: "course-2", title: "HIPAA Compliance" },
    ],
  },
};

const mockChaptersData = {
  data: {
    chapters: [
      { id: "chapter-1", title: "Introduction", chapterNumber: 1 },
      { id: "chapter-2", title: "Medical Terminology", chapterNumber: 2 },
    ],
  },
};

const mockLessonsData = {
  data: {
    lessons: [
      {
        id: "lesson-1",
        chapterId: { _id: "chapter-1", title: "Introduction", chapterNumber: 1 },
        title: "What is Interpretation?",
        lessonNumber: 1,
        contentType: "text",
        quizQuestionsCount: 5,
        isPublished: true,
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "lesson-2",
        chapterId: { _id: "chapter-1", title: "Introduction", chapterNumber: 1 },
        title: "Role of the Interpreter",
        lessonNumber: 2,
        contentType: "audio-exercise",
        quizQuestionsCount: 3,
        isPublished: false,
        createdAt: "2024-01-02T00:00:00Z",
      },
    ],
  },
};

const mockLessonDetail = {
  data: {
    lesson: {
      id: "lesson-1",
      title: "What is Interpretation?",
      lessonNumber: 1,
      content: "<h2>Introduction</h2><p>Content here</p>",
      contentType: "text",
    },
  },
};

// Helper to render with router
const renderAdminLessons = () => {
  return render(
    <MemoryRouter>
      <AdminLessons />
    </MemoryRouter>
  );
};

describe("AdminLessons Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
    vi.mocked(adminAPI.getAllCourses).mockResolvedValue(mockCoursesData as any);
    vi.mocked(adminAPI.getAllChapters).mockResolvedValue(mockChaptersData as any);
    vi.mocked(adminAPI.getAllLessons).mockResolvedValue(mockLessonsData as any);
    vi.mocked(adminAPI.getLessonById).mockResolvedValue(mockLessonDetail as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getAllLessons).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminLessons();

      expect(screen.getByText(/loading lessons/i)).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText("Lessons")).toBeInTheDocument();
      });

      expect(screen.getByText(/create and manage lesson content/i)).toBeInTheDocument();
    });

    it("should display create lesson button", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create lesson/i })).toBeInTheDocument();
      });
    });
  });

  describe("Filters", () => {
    it("should display course filter dropdown", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/filter by course/i)).toBeInTheDocument();
      });

      const courseSelects = screen.getAllByRole("combobox");
      expect(courseSelects.length).toBeGreaterThan(0);
    });

    it("should display chapter filter dropdown", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/filter by chapter/i)).toBeInTheDocument();
      });
    });

    it("should fetch chapters when course selected", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/filter by course/i)).toBeInTheDocument();
      });

      // Get the page filter selects (not modal)
      const selects = screen.getAllByRole("combobox");
      const courseSelect = selects[0];

      await user.selectOptions(courseSelect, "course-1");

      expect(adminAPI.getAllChapters).toHaveBeenCalledWith("course-1");
    });

    it("should chapter filter be disabled when no course selected", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/filter by chapter/i)).toBeInTheDocument();
      });

      const selects = screen.getAllByRole("combobox");
      const chapterSelect = selects[1];

      expect(chapterSelect).toBeDisabled();
    });
  });

  describe("Lessons List", () => {
    it("should render all lessons", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/role of the interpreter/i)).toBeInTheDocument();
    });

    it("should display lesson details", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText("Lesson 1")).toBeInTheDocument();
      });

      const chapterTexts = screen.getAllByText(/chapter 1: introduction/i);
      expect(chapterTexts.length).toBeGreaterThan(0);
      expect(screen.getByText("text")).toBeInTheDocument();
      expect(screen.getByText(/5 quiz questions/i)).toBeInTheDocument();
    });

    it("should show published status", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/published/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });
  });

  describe("Create Lesson Modal", () => {
    it("should open create modal when button clicked", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create lesson/i }));

      expect(screen.getByText(/create new lesson/i)).toBeInTheDocument();
    });

    it("should display all form fields", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create lesson/i }));

      expect(screen.getByText(/select course first/i)).toBeInTheDocument();
      expect(screen.getByText(/chapter \*/i)).toBeInTheDocument();
      expect(screen.getByText(/lesson number \*/i)).toBeInTheDocument();
      expect(screen.getByText(/content type \*/i)).toBeInTheDocument();
      expect(screen.getByText(/lesson title \*/i)).toBeInTheDocument();
      expect(screen.getByText(/content \(html\) \*/i)).toBeInTheDocument();
    });

    it("should fetch chapters when course selected in modal", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create lesson/i }));

      // Modal should have separate course select
      const selects = screen.getAllByRole("combobox");
      // Find the modal's course select (should have "Select a course" option)
      const modalCourseSelect = selects.find((select) => select.querySelector('option[value=""]')?.textContent === "Select a course");

      await user.selectOptions(modalCourseSelect!, "course-1");

      // Should fetch chapters for modal
      await waitFor(() => {
        expect(adminAPI.getAllChapters).toHaveBeenCalled();
      });
    });

    it("should create lesson with valid data", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.createLesson).mockResolvedValue({ data: {} } as any);

      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create lesson/i }));

      // Select course - find modal's course select by checking for "Select a course" option
      await waitFor(() => {
        const selects = screen.getAllByRole("combobox");
        const modalCourseSelect = selects.find((select) => select.querySelector('option[value=""]')?.textContent === "Select a course");
        expect(modalCourseSelect).toBeDefined();
      });

      const selects = screen.getAllByRole("combobox");
      const modalCourseSelect = selects.find((select) => select.querySelector('option[value=""]')?.textContent === "Select a course")!;

      await user.selectOptions(modalCourseSelect, "course-1");

      // Wait for chapters to load - check if Chapter 1 option exists
      await waitFor(() => {
        const allSelects = screen.getAllByRole("combobox");
        const hasChapterOption = allSelects.some((select) => Array.from(select.querySelectorAll("option")).some((opt) => opt.textContent?.includes("Chapter 1")));
        expect(hasChapterOption).toBe(true);
      });

      // Now find and select the chapter
      const allSelects = screen.getAllByRole("combobox");
      const chapterSelect = allSelects.find((select) => Array.from(select.querySelectorAll("option")).some((opt) => opt.textContent?.includes("Chapter 1")))!;

      await user.selectOptions(chapterSelect, "chapter-1");

      // Fill form
      const titleInput = screen.getByPlaceholderText(/what is interpretation\?/i);
      const contentTextarea = screen.getByPlaceholderText(/<h2>section title<\/h2>/i);

      await user.type(titleInput, "New Lesson");
      await user.type(contentTextarea, "<p>Content</p>");

      // Submit
      const submitButtons = screen.getAllByRole("button", { name: /create lesson/i });
      await user.click(submitButtons[1]); // Second one is in modal

      await waitFor(() => {
        expect(adminAPI.createLesson).toHaveBeenCalledWith({
          chapterId: "chapter-1",
          title: "New Lesson",
          lessonNumber: 1,
          content: "<p>Content</p>",
          contentType: "text",
        });
      });
    });

    it("should close modal on cancel", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create lesson/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create lesson/i }));

      expect(screen.getByText(/create new lesson/i)).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText(/create new lesson/i)).not.toBeInTheDocument();
    });
  });

  describe("Edit Lesson", () => {
    it("should open edit modal with pre-filled data", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit lesson/i)).toBeInTheDocument();
      });

      expect(adminAPI.getLessonById).toHaveBeenCalledWith("lesson-1");
    });

    it("should not show course/chapter selection in edit mode", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit lesson/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/select course first/i)).not.toBeInTheDocument();
    });

    it("should update lesson", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateLesson).mockResolvedValue({ data: {} } as any);

      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue(/what is interpretation\?/i);
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");

      await user.click(screen.getByRole("button", { name: /update lesson/i }));

      await waitFor(() => {
        expect(adminAPI.updateLesson).toHaveBeenCalledWith(
          "lesson-1",
          expect.objectContaining({
            title: "Updated Title",
          })
        );
      });
    });
  });

  describe("Delete Lesson", () => {
    it("should open delete confirmation modal", async () => {
      const user = userEvent.setup();
      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/delete lesson/i)).toBeInTheDocument();
      expect(screen.getByText(/lesson 1: what is interpretation\?/i)).toBeInTheDocument();
    });

    it("should delete lesson on confirmation", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.deleteLesson).mockResolvedValue({ data: {} } as any);

      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      const confirmButtons = screen.getAllByRole("button");
      const deleteConfirmButton = confirmButtons.find((btn) => btn.textContent === "Delete" && btn.className.includes("bg-red-600"));

      await user.click(deleteConfirmButton!);

      await waitFor(() => {
        expect(adminAPI.deleteLesson).toHaveBeenCalledWith("lesson-1");
      });
    });
  });

  describe("Toggle Publish", () => {
    it("should toggle publish status", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateLesson).mockResolvedValue({ data: {} } as any);

      renderAdminLessons();

      await waitFor(() => {
        expect(screen.getByText(/what is interpretation\?/i)).toBeInTheDocument();
      });

      const publishButtons = screen.getAllByTitle(/unpublish|publish/i);
      await user.click(publishButtons[0]);

      await waitFor(() => {
        expect(adminAPI.updateLesson).toHaveBeenCalledWith("lesson-1", {
          isPublished: false,
        });
      });
    });
  });

  describe("API Calls", () => {
    it("should fetch courses and lessons on mount", async () => {
      renderAdminLessons();

      await waitFor(() => {
        expect(adminAPI.getAllCourses).toHaveBeenCalled();
        expect(adminAPI.getAllLessons).toHaveBeenCalled();
      });
    });
  });
});
