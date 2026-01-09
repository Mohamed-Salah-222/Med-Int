import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminChapters from "../AdminChapters";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getAllCourses: vi.fn(),
    getAllChapters: vi.fn(),
    createChapter: vi.fn(),
    updateChapter: vi.fn(),
    deleteChapter: vi.fn(),
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
      {
        id: "chapter-1",
        courseId: { _id: "course-1", title: "Medical Interpreter Training" },
        title: "Introduction to Medical Interpreting",
        description: "Learn the basics of medical interpretation",
        chapterNumber: 1,
        lessonsCount: 5,
        testQuestionsCount: 10,
        isPublished: true,
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "chapter-2",
        courseId: { _id: "course-1", title: "Medical Interpreter Training" },
        title: "Medical Terminology",
        description: "Essential medical terms and phrases",
        chapterNumber: 2,
        lessonsCount: 3,
        testQuestionsCount: 8,
        isPublished: false,
        createdAt: "2024-01-02T00:00:00Z",
      },
    ],
  },
};

// Helper to render with router
const renderAdminChapters = () => {
  return render(
    <MemoryRouter>
      <AdminChapters />
    </MemoryRouter>
  );
};

describe("AdminChapters Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
    vi.mocked(adminAPI.getAllCourses).mockResolvedValue(mockCoursesData as any);
    vi.mocked(adminAPI.getAllChapters).mockResolvedValue(mockChaptersData as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getAllChapters).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminChapters();

      expect(screen.getByText(/loading chapters/i)).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText("Chapters")).toBeInTheDocument();
      });

      expect(screen.getByText(/organize course content into chapters/i)).toBeInTheDocument();
    });

    it("should display create chapter button", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create chapter/i })).toBeInTheDocument();
      });
    });
  });

  describe("Course Filter", () => {
    it("should display course filter dropdown", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/filter by course/i)).toBeInTheDocument();
      });

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should show all courses in filter", async () => {
      renderAdminChapters();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/hipaa compliance/i)).toBeInTheDocument();
    });

    it("should filter chapters by selected course", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "course-1");

      expect(adminAPI.getAllChapters).toHaveBeenCalledWith("course-1");
    });
  });

  describe("Chapters List", () => {
    it("should render all chapters", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/medical terminology/i)).toBeInTheDocument();
    });

    it("should display chapter details", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText("Chapter 1")).toBeInTheDocument();
      });

      expect(screen.getByText(/learn the basics of medical interpretation/i)).toBeInTheDocument();
      expect(screen.getByText(/5 lessons/i)).toBeInTheDocument();
      expect(screen.getByText(/10 test questions/i)).toBeInTheDocument();
    });

    it("should show published status", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/published/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });

    it("should display course title for each chapter", async () => {
      renderAdminChapters();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no chapters", async () => {
      vi.mocked(adminAPI.getAllChapters).mockResolvedValue({
        data: { chapters: [] },
      } as any);

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/no chapters yet/i)).toBeInTheDocument();
      });
    });

    it("should show filtered empty state", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.getAllChapters).mockResolvedValue({
        data: { chapters: [] },
      } as any);

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "course-2");

      await waitFor(() => {
        expect(screen.getByText(/no chapters in this course yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Create Chapter Modal", () => {
    it("should open create modal when button clicked", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create chapter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create chapter/i }));

      expect(screen.getByText(/create new chapter/i)).toBeInTheDocument();
    });

    it("should display all form fields", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create chapter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create chapter/i }));

      // Use text content instead of labels
      expect(screen.getByText(/course \*/i)).toBeInTheDocument();
      expect(screen.getByText(/chapter number \*/i)).toBeInTheDocument();
      expect(screen.getByText(/chapter title \*/i)).toBeInTheDocument();
      expect(screen.getByText(/description \*/i)).toBeInTheDocument();
    });

    it("should create chapter with valid data", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.createChapter).mockResolvedValue({ data: {} } as any);

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create chapter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create chapter/i }));

      // Fill form - use placeholders or get inputs directly
      const courseSelect = screen.getAllByRole("combobox")[1]; // Second select is in modal
      const numberInput = screen.getByDisplayValue("1"); // Default value
      const titleInput = screen.getByPlaceholderText(/introduction to medical interpretation/i);
      const descInput = screen.getByPlaceholderText(/this chapter covers/i);

      await user.selectOptions(courseSelect, "course-1");
      await user.clear(numberInput);
      await user.type(numberInput, "3");
      await user.type(titleInput, "New Chapter");
      await user.type(descInput, "Chapter description");

      // Submit
      const submitButtons = screen.getAllByRole("button", { name: /create chapter/i });
      await user.click(submitButtons[1]); // Second one is in modal

      await waitFor(() => {
        expect(adminAPI.createChapter).toHaveBeenCalledWith({
          courseId: "course-1",
          title: "New Chapter",
          description: "Chapter description",
          chapterNumber: 3,
        });
      });
    });

    it("should show error on create failure", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.createChapter).mockRejectedValue({
        response: { data: { message: "Chapter already exists" } },
      });

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create chapter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create chapter/i }));

      const courseSelect = screen.getAllByRole("combobox")[1];
      const titleInput = screen.getByPlaceholderText(/introduction to medical interpretation/i);
      const descInput = screen.getByPlaceholderText(/this chapter covers/i);

      await user.selectOptions(courseSelect, "course-1");
      await user.type(titleInput, "Test");
      await user.type(descInput, "Test");

      const submitButtons = screen.getAllByRole("button", { name: /create chapter/i });
      await user.click(submitButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/chapter already exists/i)).toBeInTheDocument();
      });
    });

    it("should close modal on cancel", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create chapter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create chapter/i }));

      expect(screen.getByText(/create new chapter/i)).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText(/create new chapter/i)).not.toBeInTheDocument();
    });
  });

  describe("Edit Chapter", () => {
    it("should open edit modal with pre-filled data", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      expect(screen.getByText(/edit chapter/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/introduction to medical interpreting/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/learn the basics/i)).toBeInTheDocument();
    });

    it("should update chapter with new data", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateChapter).mockResolvedValue({ data: {} } as any);

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      // Find the title input by its current value
      const titleInput = screen.getByDisplayValue(/introduction to medical interpreting/i);
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");

      await user.click(screen.getByRole("button", { name: /update chapter/i }));

      await waitFor(() => {
        expect(adminAPI.updateChapter).toHaveBeenCalledWith("chapter-1", {
          title: "Updated Title",
          description: "Learn the basics of medical interpretation",
          chapterNumber: 1,
        });
      });
    });

    it("should not show course selection in edit mode", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      expect(screen.queryByLabelText(/course \*/i)).not.toBeInTheDocument();
    });
  });

  describe("Delete Chapter", () => {
    it("should open delete confirmation modal", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/delete chapter/i)).toBeInTheDocument();
      expect(screen.getByText(/chapter 1: introduction to medical interpreting/i)).toBeInTheDocument();
    });

    it("should delete chapter on confirmation", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.deleteChapter).mockResolvedValue({ data: {} } as any);

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      // Find the DELETE button in the modal (not the icon buttons)
      const confirmButtons = screen.getAllByRole("button");
      const deleteConfirmButton = confirmButtons.find((btn) => btn.textContent === "Delete" && btn.className.includes("bg-red-600"));

      await user.click(deleteConfirmButton!);

      await waitFor(() => {
        expect(adminAPI.deleteChapter).toHaveBeenCalledWith("chapter-1");
      });
    });

    it("should show alert on delete error", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.deleteChapter).mockRejectedValue(new Error("Delete failed"));

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      const confirmButtons = screen.getAllByRole("button");
      const deleteConfirmButton = confirmButtons.find((btn) => btn.textContent === "Delete" && btn.className.includes("bg-red-600"));

      await user.click(deleteConfirmButton!);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Failed to delete chapter");
      });
    });

    it("should close delete modal on cancel", async () => {
      const user = userEvent.setup();
      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/delete chapter/i)).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText(/delete chapter/i)).not.toBeInTheDocument();
    });
  });

  describe("Toggle Publish", () => {
    it("should toggle publish status", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateChapter).mockResolvedValue({ data: {} } as any);

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const publishButtons = screen.getAllByTitle(/unpublish|publish/i);
      await user.click(publishButtons[0]);

      await waitFor(() => {
        expect(adminAPI.updateChapter).toHaveBeenCalledWith("chapter-1", {
          isPublished: false,
        });
      });
    });

    it("should show alert on publish error", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateChapter).mockRejectedValue(new Error("Update failed"));

      renderAdminChapters();

      await waitFor(() => {
        expect(screen.getByText(/introduction to medical interpreting/i)).toBeInTheDocument();
      });

      const publishButtons = screen.getAllByTitle(/unpublish|publish/i);
      await user.click(publishButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Failed to update chapter status");
      });
    });
  });

  describe("API Calls", () => {
    it("should fetch courses and chapters on mount", async () => {
      renderAdminChapters();

      await waitFor(() => {
        expect(adminAPI.getAllCourses).toHaveBeenCalled();
        expect(adminAPI.getAllChapters).toHaveBeenCalled();
      });
    });
  });
});
