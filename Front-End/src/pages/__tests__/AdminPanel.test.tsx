import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminPanel from "../AdminPanel";
import { AuthContext } from "../../context/AuthContext";

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

// Helper to render with auth context
const renderAdminPanel = (user: any = null) => {
  const authValue = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <AdminPanel />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("AdminPanel Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Access Control", () => {
    it("should deny access for non-authenticated users", () => {
      renderAdminPanel(null);

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/you don't have permission/i)).toBeInTheDocument();
    });

    it("should deny access for regular users", () => {
      const regularUser = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        role: "User",
      };

      renderAdminPanel(regularUser);

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it("should allow access for Admin users", () => {
      const adminUser = {
        id: "admin-1",
        name: "Admin User",
        email: "admin@example.com",
        role: "Admin",
      };

      renderAdminPanel(adminUser);

      expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
      expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
    });

    it("should allow access for SuperVisor users", () => {
      const supervisorUser = {
        id: "supervisor-1",
        name: "Supervisor User",
        email: "supervisor@example.com",
        role: "SuperVisor",
      };

      renderAdminPanel(supervisorUser);

      expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
      expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
    });

    it("should navigate to dashboard when back button clicked", async () => {
      const user = userEvent.setup();
      const regularUser = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        role: "User",
      };

      renderAdminPanel(regularUser);

      const backButton = screen.getByRole("button", { name: /back to dashboard/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Admin Panel Content", () => {
    const adminUser = {
      id: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "Admin",
    };

    it("should render page header", () => {
      renderAdminPanel(adminUser);

      expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it("should display admin name in welcome message", () => {
      renderAdminPanel(adminUser);

      expect(screen.getByText(/admin user/i)).toBeInTheDocument();
    });

    it("should render all admin cards", () => {
      renderAdminPanel(adminUser);

      expect(screen.getByText("Courses")).toBeInTheDocument();
      expect(screen.getByText("Chapters")).toBeInTheDocument();
      expect(screen.getByText("Lessons")).toBeInTheDocument();
      expect(screen.getByText("Questions")).toBeInTheDocument();
      expect(screen.getByText("Statistics")).toBeInTheDocument();
      expect(screen.getByText("Users")).toBeInTheDocument();
      expect(screen.getByText("Certificates")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should display card descriptions", () => {
      renderAdminPanel(adminUser);

      expect(screen.getByText(/create and manage courses/i)).toBeInTheDocument();
      expect(screen.getByText(/organize course chapters/i)).toBeInTheDocument();
      expect(screen.getByText(/create lesson content/i)).toBeInTheDocument();
      expect(screen.getByText(/manage quiz, test & exam questions/i)).toBeInTheDocument();
      expect(screen.getByText(/view platform analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/manage user accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/view issued certificates/i)).toBeInTheDocument();
      expect(screen.getByText(/platform configuration/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    const adminUser = {
      id: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "Admin",
    };

    it("should navigate to courses page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const coursesButton = screen.getByRole("button", { name: /courses create and manage courses/i });
      await user.click(coursesButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/courses");
    });

    it("should navigate to chapters page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const chaptersButton = screen.getByRole("button", { name: /chapters organize course chapters/i });
      await user.click(chaptersButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/chapters");
    });

    it("should navigate to lessons page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const lessonsButton = screen.getByRole("button", { name: /lessons create lesson content/i });
      await user.click(lessonsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/lessons");
    });

    it("should navigate to questions page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const questionsButton = screen.getByRole("button", { name: /questions manage quiz, test & exam questions/i });
      await user.click(questionsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/questions");
    });

    it("should navigate to statistics page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const statsButton = screen.getByRole("button", { name: /statistics view platform analytics/i });
      await user.click(statsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/stats");
    });

    it("should navigate to users page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const usersButton = screen.getByRole("button", { name: /users manage user accounts/i });
      await user.click(usersButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    });

    it("should navigate to certificates page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const certificatesButton = screen.getByRole("button", { name: /certificates view issued certificates/i });
      await user.click(certificatesButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/certificates");
    });

    it("should navigate to settings page", async () => {
      const user = userEvent.setup();
      renderAdminPanel(adminUser);

      const settingsButton = screen.getByRole("button", { name: /settings platform configuration/i });
      await user.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/settings");
    });
  });
});
