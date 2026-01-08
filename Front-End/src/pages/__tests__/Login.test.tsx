import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";
import { AuthContext } from "../../context/AuthContext";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with AuthContext
const renderLogin = (authValue: any = null) => {
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
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("Login Page", () => {
  let mockLogin: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLogin = vi.fn();
  });

  describe("Initial Render", () => {
    it("should render all form fields", () => {
      renderLogin();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should render Google sign-in button", () => {
      renderLogin();

      expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      renderLogin();

      expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
    });

    it("should render create account link", () => {
      renderLogin();

      expect(screen.getByRole("link", { name: /create account/i })).toBeInTheDocument();
    });

    it("should render logo that navigates to home", async () => {
      const user = userEvent.setup();
      renderLogin();

      const logo = screen.getByText("Medical Interpreter Academy");
      await user.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility", async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const toggleButton = screen.getByRole("button", { name: "" }); // Eye icon button

      // Initially password type
      expect(passwordInput).toHaveAttribute("type", "password");

      // Click to show
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      // Click to hide
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Successful Login", () => {
    it("should login and redirect Admin to /admin", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: { role: "Admin" },
        token: "test-token",
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(async () => {
        authValue.user = { role: "Admin" };
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "admin@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("admin@example.com", "password123");
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });
    });

    it("should login and redirect SuperVisor to /admin", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: { role: "SuperVisor" },
        token: "test-token",
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(async () => {
        authValue.user = { role: "SuperVisor" };
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "supervisor@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });
    });

    it("should login and redirect Student to /dashboard", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(async () => {
        authValue.user = { role: "Student" };
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "student@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should login and redirect User to /course", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: { role: "User" },
        token: "test-token",
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(async () => {
        authValue.user = { role: "User" };
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/course");
      });
    });

    it("should redirect to /dashboard for unknown role", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: { role: "Unknown" },
        token: "test-token",
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(async () => {
        authValue.user = { role: "Unknown" };
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "unknown@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should show loading state during login", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: null,
        token: null,
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it("should disable form during login", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: null,
        token: null,
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
        expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      });
    });
  });

  describe("Login Errors", () => {
    it("should show error message when login fails", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: null,
        token: null,
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockRejectedValue({
        response: { data: { message: "Invalid credentials" } },
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "wrong@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("should show generic error when no message provided", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: null,
        token: null,
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockRejectedValue(new Error("Network error"));

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
      });
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();

      const authValue = {
        user: null,
        token: null,
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      mockLogin.mockRejectedValue({
        response: { data: { message: "Error" } },
      });

      renderLogin(authValue);

      await user.type(screen.getByLabelText(/email address/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(screen.getByLabelText(/email address/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).not.toBeDisabled();
    });
  });

  describe("Google Sign-In", () => {
    it("should redirect to Google OAuth when clicking Google button", async () => {
      const user = userEvent.setup();

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: "" } as any;

      renderLogin();

      const googleButton = screen.getByRole("button", { name: /continue with google/i });
      await user.click(googleButton);

      expect(window.location.href).toContain("/api/auth/google");
    });
  });

  describe("Navigation Links", () => {
    it("should have link to forgot password page", () => {
      renderLogin();

      const forgotLink = screen.getByRole("link", { name: /forgot password/i });
      expect(forgotLink).toHaveAttribute("href", "/forgot-password");
    });

    it("should have link to registration page", () => {
      renderLogin();

      const registerLink = screen.getByRole("link", { name: /create account/i });
      expect(registerLink).toHaveAttribute("href", "/register");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission", async () => {
      const user = userEvent.setup();
      const authValue = {
        user: null,
        token: null,
        login: mockLogin,
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLogin(authValue);

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // HTML5 validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("should handle missing auth context gracefully", () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={undefined}>
            <Login />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Should render without crashing
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
