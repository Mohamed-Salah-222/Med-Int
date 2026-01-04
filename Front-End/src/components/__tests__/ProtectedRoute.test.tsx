import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "../ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";

// Mock Navigate component to track navigation
const mockNavigateFn = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigateFn(to);
      return <div data-testid="navigate-mock">Redirecting to {to}</div>;
    },
  };
});

// Helper to render with AuthContext and Router
const renderWithAuth = (ui: React.ReactElement, authValue: any) => {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/protected" element={ui} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("ProtectedRoute", () => {
  const ProtectedContent = <div>Protected Content</div>;

  beforeEach(() => {
    mockNavigateFn.mockClear();
    // Mock window.history.back
    window.history.back = vi.fn();
    // Mock window.location.href setter
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when auth is loading", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, { loading: true, token: null, user: null });

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Not Authenticated", () => {
    it("should redirect to /login when no token", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, { loading: false, token: null, user: null });

      expect(mockNavigateFn).toHaveBeenCalledWith("/login");
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should redirect to /login even if requireStudent is false", () => {
      renderWithAuth(<ProtectedRoute requireStudent={false}>{ProtectedContent}</ProtectedRoute>, { loading: false, token: null, user: null });

      expect(mockNavigateFn).toHaveBeenCalledWith("/login");
    });

    it("should redirect to /login even if requireAdmin is true", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, { loading: false, token: null, user: null });

      expect(mockNavigateFn).toHaveBeenCalledWith("/login");
    });
  });

  describe("Student Role Access", () => {
    const studentAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "1", email: "student@test.com", role: "Student", name: "Test Student" },
    };

    it("should allow Student access when requireStudent is true (default)", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, studentAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow Student access when requireStudent is explicitly true", () => {
      renderWithAuth(<ProtectedRoute requireStudent={true}>{ProtectedContent}</ProtectedRoute>, studentAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow Student access when requireStudent is false", () => {
      renderWithAuth(<ProtectedRoute requireStudent={false}>{ProtectedContent}</ProtectedRoute>, studentAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should DENY Student access when requireAdmin is true", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, studentAuth);

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(screen.getByText("You need admin privileges to access this page.")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should show Go Back button for denied Student trying to access admin page", async () => {
      const user = userEvent.setup();
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, studentAuth);

      const goBackButton = screen.getByRole("button", { name: /go back/i });
      expect(goBackButton).toBeInTheDocument();

      await user.click(goBackButton);
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe("User Role Access", () => {
    const userAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "2", email: "user@test.com", role: "User", name: "Test User" },
    };

    it("should DENY User access when requireStudent is true (default)", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, userAuth);

      expect(screen.getByText("Subscription Required")).toBeInTheDocument();
      expect(screen.getByText("You need to subscribe to access the course content. Enroll now to start learning!")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should show enrollment prompt for User role", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, userAuth);

      expect(screen.getByRole("button", { name: /view course & enroll/i })).toBeInTheDocument();
    });

    it("should redirect to /course when clicking View Course & Enroll", async () => {
      const user = userEvent.setup();
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, userAuth);

      const enrollButton = screen.getByRole("button", { name: /view course & enroll/i });
      await user.click(enrollButton);

      expect(window.location.href).toBe("/course");
    });

    it("should allow User access when requireStudent is false", () => {
      renderWithAuth(<ProtectedRoute requireStudent={false}>{ProtectedContent}</ProtectedRoute>, userAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should DENY User access when requireAdmin is true", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, userAuth);

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  describe("Admin Role Access", () => {
    const adminAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "3", email: "admin@test.com", role: "Admin", name: "Test Admin" },
    };

    it("should allow Admin access when requireStudent is true", () => {
      renderWithAuth(<ProtectedRoute requireStudent={true}>{ProtectedContent}</ProtectedRoute>, adminAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow Admin access when requireStudent is false", () => {
      renderWithAuth(<ProtectedRoute requireStudent={false}>{ProtectedContent}</ProtectedRoute>, adminAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow Admin access when requireAdmin is true", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, adminAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow Admin access with both requireStudent and requireAdmin false", () => {
      renderWithAuth(
        <ProtectedRoute requireStudent={false} requireAdmin={false}>
          {ProtectedContent}
        </ProtectedRoute>,
        adminAuth
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("SuperVisor Role Access", () => {
    const supervisorAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "4", email: "supervisor@test.com", role: "SuperVisor", name: "Test Supervisor" },
    };

    it("should allow SuperVisor access when requireStudent is true", () => {
      renderWithAuth(<ProtectedRoute requireStudent={true}>{ProtectedContent}</ProtectedRoute>, supervisorAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should allow SuperVisor access when requireAdmin is true", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, supervisorAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should treat SuperVisor same as Admin for admin routes", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, supervisorAuth);

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined user object", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, { loading: false, token: "fake-token", user: undefined });

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should handle null user object", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, { loading: false, token: "fake-token", user: null });

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should handle missing role property", () => {
      renderWithAuth(<ProtectedRoute requireAdmin={true}>{ProtectedContent}</ProtectedRoute>, { loading: false, token: "fake-token", user: { id: "1", email: "test@test.com" } });

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("should handle invalid role string", () => {
      renderWithAuth(<ProtectedRoute>{ProtectedContent}</ProtectedRoute>, { loading: false, token: "fake-token", user: { id: "1", email: "test@test.com", role: "InvalidRole" } });

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should handle undefined AuthContext", () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={undefined}>
            <ProtectedRoute>{ProtectedContent}</ProtectedRoute>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(mockNavigateFn).toHaveBeenCalledWith("/login");
    });

    it("should handle null AuthContext", () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={undefined}>
            <ProtectedRoute>{ProtectedContent}</ProtectedRoute>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(mockNavigateFn).toHaveBeenCalledWith("/login");
    });
  });

  describe("Combined Requirements", () => {
    it("should prioritize requireAdmin over requireStudent", () => {
      const studentAuth = {
        loading: false,
        token: "fake-token",
        user: { id: "1", email: "student@test.com", role: "Student" },
      };

      renderWithAuth(
        <ProtectedRoute requireStudent={true} requireAdmin={true}>
          {ProtectedContent}
        </ProtectedRoute>,
        studentAuth
      );

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(screen.queryByText("Subscription Required")).not.toBeInTheDocument();
    });

    it("should allow Admin even when requireStudent is true", () => {
      const adminAuth = {
        loading: false,
        token: "fake-token",
        user: { id: "3", email: "admin@test.com", role: "Admin" },
      };

      renderWithAuth(
        <ProtectedRoute requireStudent={true} requireAdmin={false}>
          {ProtectedContent}
        </ProtectedRoute>,
        adminAuth
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});

describe("PublicOnlyRoute", () => {
  const PublicContent = <div>Public Content</div>;

  beforeEach(() => {
    mockNavigateFn.mockClear();
  });

  describe("Loading State", () => {
    it("should show loading spinner when auth is loading", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, { loading: true, token: null, user: null });

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    });
  });

  describe("Not Authenticated", () => {
    it("should show public content when no token", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, { loading: false, token: null, user: null });

      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });

    it("should show public content when user is null", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, { loading: false, token: null, user: null });

      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });
  });

  describe("Authenticated - Admin Role", () => {
    const adminAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "1", email: "admin@test.com", role: "Admin" },
    };

    it("should redirect Admin to /admin", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, adminAuth);

      expect(mockNavigateFn).toHaveBeenCalledWith("/admin");
      expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    });
  });

  describe("Authenticated - SuperVisor Role", () => {
    const supervisorAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "2", email: "supervisor@test.com", role: "SuperVisor" },
    };

    it("should redirect SuperVisor to /admin", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, supervisorAuth);

      expect(mockNavigateFn).toHaveBeenCalledWith("/admin");
    });
  });

  describe("Authenticated - Student Role", () => {
    const studentAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "3", email: "student@test.com", role: "Student" },
    };

    it("should redirect Student to /dashboard", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, studentAuth);

      expect(mockNavigateFn).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Authenticated - User Role", () => {
    const userAuth = {
      loading: false,
      token: "fake-token",
      user: { id: "4", email: "user@test.com", role: "User" },
    };

    it("should redirect User to /course", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, userAuth);

      expect(mockNavigateFn).toHaveBeenCalledWith("/course");
    });
  });

  describe("Edge Cases", () => {
    it("should redirect to /course when role is undefined", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, { loading: false, token: "fake-token", user: { id: "1", email: "test@test.com" } });

      expect(mockNavigateFn).toHaveBeenCalledWith("/course");
    });

    it("should redirect to /course when role is invalid", () => {
      renderWithAuth(<PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>, { loading: false, token: "fake-token", user: { id: "1", email: "test@test.com", role: "InvalidRole" } });

      expect(mockNavigateFn).toHaveBeenCalledWith("/course");
    });

    it("should show content when AuthContext is undefined and no token", () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={undefined}>
            <PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });

    it("should show content when AuthContext is null and no token", () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={undefined}>
            <PublicOnlyRoute>{PublicContent}</PublicOnlyRoute>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });
  });
});
