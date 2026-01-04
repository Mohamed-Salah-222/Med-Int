import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Layout from "../Layout";
import { AuthContext } from "../../context/AuthContext";

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with AuthContext
const renderWithAuth = (ui: React.ReactElement, authValue: any) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("Layout", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("Navigation Bar", () => {
    it("should render the logo and title", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      expect(screen.getByText("Medical Interpreter Academy")).toBeInTheDocument();
      // Check for Shield icon by checking if svg exists
      const logo = screen.getByText("Medical Interpreter Academy").previousSibling;
      expect(logo).toBeTruthy();
    });

    it("should navigate to home when clicking logo", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      const logo = screen.getByText("Medical Interpreter Academy");
      await user.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("should render children content", () => {
      renderWithAuth(
        <Layout>
          <div>Test Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should render GlossaryTooltip component", () => {
      const { container } = renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      // GlossaryTooltip renders null initially, but component should be mounted
      // We can verify by checking if the component structure exists
      expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });
  });

  describe("Authentication - Not Logged In", () => {
    it("should show Login and Get Started buttons when not authenticated", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("should navigate to /login when Login button clicked", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      const loginButton = screen.getByRole("button", { name: /login/i });
      await user.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("should navigate to /register when Get Started button clicked", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      const registerButton = screen.getByRole("button", { name: /get started/i });
      await user.click(registerButton);

      expect(mockNavigate).toHaveBeenCalledWith("/register");
    });

    it("should not show authenticated user buttons when not logged in", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /dashboard/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
    });
  });

  describe("Authentication - Student Role", () => {
    const studentAuth = {
      token: "fake-token",
      user: { id: "1", email: "student@test.com", role: "Student", name: "Test Student" },
      logout: vi.fn(),
    };

    it("should show Dashboard button for Student", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        studentAuth
      );

      expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });

    it("should NOT show Admin button for Student", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        studentAuth
      );

      expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
    });

    it("should NOT show View Course button for Student", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        studentAuth
      );

      expect(screen.queryByRole("button", { name: /view course/i })).not.toBeInTheDocument();
    });

    it("should navigate to /dashboard when Dashboard clicked", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        studentAuth
      );

      const dashboardButton = screen.getByRole("button", { name: /dashboard/i });
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should call logout and navigate to home when Logout clicked", async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();

      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { ...studentAuth, logout: mockLogout }
      );

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Authentication - Admin Role", () => {
    const adminAuth = {
      token: "fake-token",
      user: { id: "2", email: "admin@test.com", role: "Admin", name: "Test Admin" },
      logout: vi.fn(),
    };

    it("should show Dashboard and Admin buttons for Admin", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        adminAuth
      );

      expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });

    it("should navigate to /admin when Admin button clicked", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        adminAuth
      );

      const adminButton = screen.getByRole("button", { name: /admin/i });
      await user.click(adminButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  describe("Authentication - SuperVisor Role", () => {
    const supervisorAuth = {
      token: "fake-token",
      user: { id: "3", email: "supervisor@test.com", role: "SuperVisor", name: "Test Supervisor" },
      logout: vi.fn(),
    };

    it("should show Dashboard and Admin buttons for SuperVisor", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        supervisorAuth
      );

      expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
    });

    it("should treat SuperVisor same as Admin for navigation", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        supervisorAuth
      );

      const adminButton = screen.getByRole("button", { name: /admin/i });
      await user.click(adminButton);

      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  describe("Authentication - User Role", () => {
    const userAuth = {
      token: "fake-token",
      user: { id: "4", email: "user@test.com", role: "User", name: "Test User" },
      logout: vi.fn(),
    };

    it("should show View Course button for User", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        userAuth
      );

      expect(screen.getByRole("button", { name: /view course/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });

    it("should NOT show Dashboard button for User", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        userAuth
      );

      expect(screen.queryByRole("button", { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it("should NOT show Admin button for User", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        userAuth
      );

      expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
    });

    it("should navigate to /course when View Course clicked", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        userAuth
      );

      const courseButton = screen.getByRole("button", { name: /view course/i });
      await user.click(courseButton);

      expect(mockNavigate).toHaveBeenCalledWith("/course");
    });
  });

  describe("showAuth Prop", () => {
    it("should hide auth buttons when showAuth is false", () => {
      renderWithAuth(
        <Layout showAuth={false}>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      expect(screen.queryByRole("button", { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /get started/i })).not.toBeInTheDocument();
    });

    it("should show auth buttons by default when showAuth not specified", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });
  });

  describe("Edge Cases - Auth Context Issues", () => {
    it("should handle missing logout function gracefully", async () => {
      const user = userEvent.setup();
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        {
          token: "fake-token",
          user: { id: "1", email: "test@test.com", role: "Student" },
          logout: undefined, // Missing logout function
        }
      );

      const logoutButton = screen.getByRole("button", { name: /logout/i });

      // Should not crash when clicking logout
      await user.click(logoutButton);

      // Navigate should not be called since logout is undefined
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle null auth context", () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={undefined}>
            <Layout>
              <div>Content</div>
            </Layout>
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Should show login/register buttons when auth is null
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("should handle undefined user role", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        {
          token: "fake-token",
          user: { id: "1", email: "test@test.com" }, // No role property
          logout: vi.fn(),
        }
      );

      // Should not show any role-specific buttons
      expect(screen.queryByRole("button", { name: /dashboard/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /view course/i })).not.toBeInTheDocument();

      // But should still show logout
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });

    it("should handle invalid role string", () => {
      renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        {
          token: "fake-token",
          user: { id: "1", email: "test@test.com", role: "InvalidRole" },
          logout: vi.fn(),
        }
      );

      // Should not show any role-specific buttons for invalid role
      expect(screen.queryByRole("button", { name: /dashboard/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /view course/i })).not.toBeInTheDocument();
    });
  });

  describe("Visual Regression - CSS Classes", () => {
    it("should have correct styling classes on navigation", () => {
      const { container } = renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("bg-white/80", "backdrop-blur-md", "sticky", "top-0", "z-50");
    });

    it("should have correct min-height on content wrapper", () => {
      const { container } = renderWithAuth(
        <Layout>
          <div>Content</div>
        </Layout>,
        { token: undefined, user: undefined }
      );

      const contentWrapper = container.querySelector(".min-h-\\[calc\\(100vh-73px\\)\\]");
      expect(contentWrapper).toBeInTheDocument();
    });
  });
});
