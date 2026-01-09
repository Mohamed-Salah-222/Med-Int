import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminCourses from "../AdminCourses";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getAllCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
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
      {
        id: "course-1",
        title: "Medical Interpreter Training",
        description: "Complete professional medical interpreter training",
        totalChapters: 10,
        chaptersCount: 5,
        isPublished: true,
        finalExamQuestionsCount: 50,
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "course-2",
        title: "HIPAA Compliance",
        description: "Learn about patient privacy and data protection",
        totalChapters: 5,
        chaptersCount: 3,
        isPublished: false,
        finalExamQuestionsCount: 25,
        createdAt: "2024-01-02T00:00:00Z",
      },
    ],
  },
};

// Helper to render with router
const renderAdminCourses = () => {
  return render(
    <MemoryRouter>
      <AdminCourses />
    </MemoryRouter>
  );
};

describe("AdminCourses Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
    vi.mocked(adminAPI.getAllCourses).mockResolvedValue(mockCoursesData as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getAllCourses).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminCourses();

      expect(screen.getByText(/loading courses/i)).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByText("Courses")).toBeInTheDocument();
      });

      expect(screen.getByText(/manage all courses in the platform/i)).toBeInTheDocument();
    });

    it("should display create course button", async () => {
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create course/i })).toBeInTheDocument();
      });
    });
  });

  describe("Courses List", () => {
    it("should render all courses", async () => {
      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/hipaa compliance/i)).toBeInTheDocument();
    });

    it("should display course details", async () => {
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByText(/complete professional medical interpreter training/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/5 \/ 10 chapters/i)).toBeInTheDocument();
      expect(screen.getByText(/50 exam questions/i)).toBeInTheDocument();
    });

    it("should show published status", async () => {
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByText(/published/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no courses", async () => {
      vi.mocked(adminAPI.getAllCourses).mockResolvedValue({
        data: { courses: [] },
      } as any);

      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByText(/no courses yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Create Course Modal", () => {
    it("should open create modal when button clicked", async () => {
      const user = userEvent.setup();
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create course/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create course/i }));

      expect(screen.getByText(/create new course/i)).toBeInTheDocument();
    });

    it("should display all form fields", async () => {
      const user = userEvent.setup();
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create course/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create course/i }));

      expect(screen.getByText(/course title/i)).toBeInTheDocument();
      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/total chapters/i)).toBeInTheDocument();
    });

    it("should create course with valid data", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.createCourse).mockResolvedValue({ data: {} } as any);

      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create course/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create course/i }));

      // Fill form
      const titleInput = screen.getByPlaceholderText(/medical interpreter certification/i);
      const descInput = screen.getByPlaceholderText(/complete professional medical interpreter training/i);
      const chaptersInput = screen.getByDisplayValue("10");

      await user.type(titleInput, "New Course");
      await user.type(descInput, "Course description");
      await user.clear(chaptersInput);
      await user.type(chaptersInput, "15");

      // Submit
      const submitButtons = screen.getAllByRole("button", { name: /create course/i });
      await user.click(submitButtons[1]); // Second one is in modal

      await waitFor(() => {
        expect(adminAPI.createCourse).toHaveBeenCalledWith({
          title: "New Course",
          description: "Course description",
          totalChapters: 15,
        });
      });
    });

    it("should show error on create failure", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.createCourse).mockRejectedValue({
        response: { data: { message: "Course already exists" } },
      });

      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create course/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create course/i }));

      const titleInput = screen.getByPlaceholderText(/medical interpreter certification/i);
      const descInput = screen.getByPlaceholderText(/complete professional medical interpreter training/i);

      await user.type(titleInput, "Test");
      await user.type(descInput, "Test");

      const submitButtons = screen.getAllByRole("button", { name: /create course/i });
      await user.click(submitButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/course already exists/i)).toBeInTheDocument();
      });
    });

    it("should close modal on cancel", async () => {
      const user = userEvent.setup();
      renderAdminCourses();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create course/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create course/i }));

      expect(screen.getByText(/create new course/i)).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText(/create new course/i)).not.toBeInTheDocument();
    });
  });

  describe("Edit Course", () => {
    it("should open edit modal with pre-filled data", async () => {
      const user = userEvent.setup();
      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      expect(screen.getByText(/edit course/i)).toBeInTheDocument();

      // Get all textboxes - first is input, second is textarea
      const textboxes = screen.getAllByRole("textbox");
      expect(textboxes[0]).toHaveValue("Medical Interpreter Training"); // Title input
      expect(textboxes[1]).toHaveValue("Complete professional medical interpreter training"); // Description textarea
    });

    it("should update course with new data", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateCourse).mockResolvedValue({ data: {} } as any);

      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const editButtons = screen.getAllByTitle("Edit");
      await user.click(editButtons[0]);

      // Get all textboxes - first is input (title)
      const textboxes = screen.getAllByRole("textbox");
      const titleInput = textboxes[0];

      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");

      await user.click(screen.getByRole("button", { name: /update course/i }));

      await waitFor(() => {
        expect(adminAPI.updateCourse).toHaveBeenCalledWith("course-1", {
          title: "Updated Title",
          description: "Complete professional medical interpreter training",
          totalChapters: 10,
        });
      });
    });
  });

  describe("Delete Course", () => {
    it("should open delete confirmation modal", async () => {
      const user = userEvent.setup();
      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/delete course/i)).toBeInTheDocument();
    });

    it("should delete course on confirmation", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.deleteCourse).mockResolvedValue({ data: {} } as any);

      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      const confirmButtons = screen.getAllByRole("button");
      const deleteConfirmButton = confirmButtons.find((btn) => btn.textContent === "Delete" && btn.className.includes("bg-red-600"));

      await user.click(deleteConfirmButton!);

      await waitFor(() => {
        expect(adminAPI.deleteCourse).toHaveBeenCalledWith("course-1");
      });
    });

    it("should show alert on delete error", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.deleteCourse).mockRejectedValue(new Error("Delete failed"));

      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      const confirmButtons = screen.getAllByRole("button");
      const deleteConfirmButton = confirmButtons.find((btn) => btn.textContent === "Delete" && btn.className.includes("bg-red-600"));

      await user.click(deleteConfirmButton!);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Failed to delete course");
      });
    });

    it("should close delete modal on cancel", async () => {
      const user = userEvent.setup();
      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByTitle("Delete");
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/delete course/i)).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText(/delete course/i)).not.toBeInTheDocument();
    });
  });

  describe("Toggle Publish", () => {
    it("should toggle publish status", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateCourse).mockResolvedValue({ data: {} } as any);

      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const publishButtons = screen.getAllByTitle(/unpublish|publish/i);
      await user.click(publishButtons[0]);

      await waitFor(() => {
        expect(adminAPI.updateCourse).toHaveBeenCalledWith("course-1", {
          isPublished: false,
        });
      });
    });

    it("should show alert on publish error", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateCourse).mockRejectedValue(new Error("Update failed"));

      renderAdminCourses();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBeGreaterThan(0);
      });

      const publishButtons = screen.getAllByTitle(/unpublish|publish/i);
      await user.click(publishButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Failed to update course status");
      });
    });
  });

  describe("API Calls", () => {
    it("should fetch courses on mount", async () => {
      renderAdminCourses();

      await waitFor(() => {
        expect(adminAPI.getAllCourses).toHaveBeenCalled();
      });
    });
  });
});
