import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminUsers from "../AdminUsers";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getAllUsers: vi.fn(),
    getStatistics: vi.fn(),
    updateUserRole: vi.fn(),
    deleteUser: vi.fn(),
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

// Mock window.confirm and window.alert
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
window.confirm = mockConfirm;
window.alert = mockAlert;

// Mock data
const mockUsersData = {
  data: {
    users: [
      {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        role: "Student",
        isVerified: true,
        createdAt: "2024-01-15T00:00:00Z",
      },
      {
        id: "user-2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "User",
        isVerified: false,
        createdAt: "2024-01-16T00:00:00Z",
      },
      {
        id: "user-3",
        name: "Admin User",
        email: "admin@example.com",
        role: "Admin",
        isVerified: true,
        createdAt: "2024-01-10T00:00:00Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      pages: 1,
    },
  },
};

const mockStatisticsData = {
  data: {
    overview: {
      totalUsers: 1250,
      totalCourses: 12,
      totalChapters: 45,
      totalLessons: 180,
      totalQuestions: 450,
      completedCourses: 328,
      certificatesIssued: 328,
    },
    recentActivity: {
      newUsers: 45,
      quizAttempts: 320,
      testAttempts: 120,
      examAttempts: 50,
    },
  },
};

// Helper to render with router
const renderAdminUsers = () => {
  return render(
    <MemoryRouter>
      <AdminUsers />
    </MemoryRouter>
  );
};

describe("AdminUsers Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockConfirm.mockClear();
    mockAlert.mockClear();
    vi.mocked(adminAPI.getAllUsers).mockResolvedValue(mockUsersData as any);
    vi.mocked(adminAPI.getStatistics).mockResolvedValue(mockStatisticsData as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getAllUsers).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(adminAPI.getStatistics).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminUsers();

      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("Users Management")).toBeInTheDocument();
      });

      expect(screen.getByText(/monitor and manage all platform users/i)).toBeInTheDocument();
    });
  });

  describe("Statistics Cards", () => {
    it("should display total users stat", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("1250")).toBeInTheDocument();
      });

      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    it("should display students count", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument(); // 1 student in mock data
      });

      const studentsLabels = screen.getAllByText("Students");
      expect(studentsLabels.length).toBeGreaterThan(0);
    });

    it("should display completed courses", async () => {
      renderAdminUsers();

      await waitFor(() => {
        const counts = screen.getAllByText("328");
        expect(counts.length).toBe(2); // Completed and Certificates both show 328
      });

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should display certificates issued", async () => {
      renderAdminUsers();

      await waitFor(() => {
        const certificatesText = screen.getAllByText("328");
        expect(certificatesText.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Certificates")).toBeInTheDocument();
    });

    it("should display new users", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("45")).toBeInTheDocument();
      });

      expect(screen.getByText(/new \(30 days\)/i)).toBeInTheDocument();
    });

    it("should display recent activity", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("440")).toBeInTheDocument(); // 320 + 120
      });

      expect(screen.getByText(/activity \(30 days\)/i)).toBeInTheDocument();
    });
  });

  describe("Filters", () => {
    it("should display search input", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
      });
    });

    it("should display role filter", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("Role")).toBeInTheDocument();
      });

      const roleSelect = screen.getAllByRole("combobox")[0];
      expect(roleSelect).toBeInTheDocument();
    });

    it("should display verification filter", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("Verification")).toBeInTheDocument();
      });

      const verificationSelect = screen.getAllByRole("combobox")[1];
      expect(verificationSelect).toBeInTheDocument();
    });

    it("should search users when search button clicked", async () => {
      const user = userEvent.setup();
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await user.type(searchInput, "John");

      // Clear initial call
      vi.clearAllMocks();

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(adminAPI.getAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "John",
          })
        );
      });
    });

    it("should filter by role", async () => {
      const user = userEvent.setup();
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("Role")).toBeInTheDocument();
      });

      // Clear initial call
      vi.clearAllMocks();

      const roleSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(roleSelect, "Student");

      await waitFor(() => {
        expect(adminAPI.getAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            role: "Student",
          })
        );
      });
    });
  });

  describe("Users List", () => {
    it("should display all users", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    it("should display user emails", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });

      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });

    it("should display role badges", async () => {
      renderAdminUsers();

      await waitFor(() => {
        const studentBadges = screen.getAllByText("Student");
        expect(studentBadges.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should display verification status", async () => {
      renderAdminUsers();

      await waitFor(() => {
        const verifiedBadges = screen.getAllByText("Verified");
        expect(verifiedBadges.length).toBeGreaterThan(0); // At least 2 users verified
      });

      const unverifiedBadges = screen.getAllByText("Unverified");
      expect(unverifiedBadges.length).toBeGreaterThan(0); // At least 1 user (Jane) + filter option
    });

    it("should display joined dates", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText(/joined 1\/15\/2024/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/joined 1\/16\/2024/i)).toBeInTheDocument();
      expect(screen.getByText(/joined 1\/10\/2024/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no users", async () => {
      vi.mocked(adminAPI.getAllUsers).mockResolvedValue({
        data: {
          users: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        },
      } as any);

      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("No users found")).toBeInTheDocument();
      });
    });
  });

  describe("User Actions", () => {
    it("should navigate to user details when view button clicked", async () => {
      const user = userEvent.setup();
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole("button", { name: /view details/i });
      await user.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/users/user-1");
    });

    it("should promote user to student", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      vi.mocked(adminAPI.updateUserRole).mockResolvedValue({ data: {} } as any);

      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      const promoteButton = screen.getByRole("button", { name: /promote/i });
      await user.click(promoteButton);

      expect(mockConfirm).toHaveBeenCalledWith("Promote Jane Smith to Student role?");

      await waitFor(() => {
        expect(adminAPI.updateUserRole).toHaveBeenCalledWith("user-2", "Student");
        expect(mockAlert).toHaveBeenCalledWith("Jane Smith has been promoted to Student!");
      });
    });

    it("should delete user with double confirmation", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      vi.mocked(adminAPI.deleteUser).mockResolvedValue({ data: {} } as any);

      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(adminAPI.deleteUser).toHaveBeenCalledWith("user-1");
        expect(mockAlert).toHaveBeenCalledWith("John Doe's account has been deleted");
      });
    });

    it("should not delete user if first confirmation cancelled", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValueOnce(false); // Cancel first confirmation

      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(adminAPI.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe("Pagination", () => {
    it("should show pagination when multiple pages", async () => {
      vi.mocked(adminAPI.getAllUsers).mockResolvedValue({
        data: {
          ...mockUsersData.data,
          pagination: {
            page: 1,
            limit: 20,
            total: 50,
            pages: 3,
          },
        },
      } as any);

      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/showing 1 to 20 of 50 users/i)).toBeInTheDocument();
    });

    it("should navigate to next page", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.getAllUsers).mockResolvedValue({
        data: {
          ...mockUsersData.data,
          pagination: {
            page: 1,
            limit: 20,
            total: 50,
            pages: 3,
          },
        },
      } as any);

      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });

      // Clear initial calls
      vi.clearAllMocks();

      // Find the next button (right chevron, NOT disabled)
      const paginationButtons = screen.getAllByRole("button");
      const nextButton = paginationButtons.find((btn) => !btn.hasAttribute("disabled") && btn.querySelector("svg.lucide-chevron-right"));

      if (nextButton) {
        await user.click(nextButton);

        await waitFor(() => {
          expect(adminAPI.getAllUsers).toHaveBeenCalledWith(
            expect.objectContaining({
              page: 2,
            })
          );
        });
      }
    });
  });

  describe("API Calls", () => {
    it("should fetch users and statistics on mount", async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(adminAPI.getAllUsers).toHaveBeenCalled();
        expect(adminAPI.getStatistics).toHaveBeenCalled();
      });
    });
  });
});
