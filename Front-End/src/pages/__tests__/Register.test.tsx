import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register";
import { authAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  authAPI: {
    register: vi.fn(),
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

// Helper to render with router
const renderRegister = () => {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
};

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe("Initial Render", () => {
    it("should render all form fields", () => {
      renderRegister();

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    it("should render Google sign-in button", () => {
      renderRegister();

      expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    });

    it("should render login link", () => {
      renderRegister();

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should render logo that navigates to home", async () => {
      const user = userEvent.setup();
      renderRegister();

      const logo = screen.getByText("Medical Interpreter Academy");
      await user.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility", async () => {
      const user = userEvent.setup();
      renderRegister();

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

  describe("Password Strength Indicator", () => {
    it("should not show strength indicator when password is empty", () => {
      renderRegister();

      const strengthBar = screen.queryByRole("progressbar");
      expect(strengthBar).not.toBeInTheDocument();
    });

    it("should show strength indicator when typing password", async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, "weak");

      expect(screen.getByText(/use 8\+ chars with uppercase, lowercase & number/i)).toBeInTheDocument();
    });

    it("should calculate weak password strength", async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, "weak");

      const strengthBar = passwordInput.parentElement?.parentElement?.querySelector(".bg-red-500");
      expect(strengthBar).toBeInTheDocument();
    });

    it("should calculate strong password strength", async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, "StrongPass123!");

      const strengthBar = passwordInput.parentElement?.parentElement?.querySelector(".bg-emerald-600");
      expect(strengthBar).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error if terms not agreed", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");

      // Don't check terms checkbox
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/you must agree to the terms of service/i)).toBeInTheDocument();
      });
    });

    it("should show error for weak password", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "weak");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should show error for password without uppercase", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should show error for password without lowercase", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "PASSWORD123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should show error for password without number", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe("Successful Registration", () => {
    it("should register successfully and redirect to verify email", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockResolvedValue({} as any);

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith("John Doe", "john@example.com", "Password123");
      });

      await waitFor(() => {
        expect(screen.getByText(/success! redirecting/i)).toBeInTheDocument();
      });

      // Wait for redirect (2 second delay)
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/verify-email", { state: { email: "john@example.com" } });
        },
        { timeout: 3000 }
      );
    });

    it("should show loading state during registration", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });
    });

    it("should disable form during registration", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeDisabled();
        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
        expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
        expect(screen.getByRole("checkbox", { name: /terms of service/i })).toBeDisabled();
      });
    });
  });

  describe("Registration Errors", () => {
    it("should show error message when registration fails", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockRejectedValue({
        response: { data: { message: "Email already exists" } },
      });

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });
    });

    it("should show generic error when no message provided", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockRejectedValue(new Error("Network error"));

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText("Registration failed")).toBeInTheDocument();
      });
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockRejectedValue({
        response: { data: { message: "Error" } },
      });

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email address/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(screen.getByLabelText(/full name/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/email address/i)).not.toBeDisabled();
    });
  });

  describe("Google Sign-In", () => {
    it("should redirect to Google OAuth when clicking Google button", async () => {
      const user = userEvent.setup();

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: "" } as any;

      renderRegister();

      const googleButton = screen.getByRole("button", { name: /continue with google/i });
      await user.click(googleButton);

      expect(window.location.href).toContain("/api/auth/google");
    });
  });

  describe("Terms Links", () => {
    it("should render terms of service link", () => {
      renderRegister();

      const termsLink = screen.getByRole("link", { name: /terms of service/i });
      expect(termsLink).toHaveAttribute("href", "/terms-of-service");
    });

    it("should render privacy policy link", () => {
      renderRegister();

      const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
      expect(privacyLink).toHaveAttribute("href", "/privacy-policy");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.click(screen.getByRole("button", { name: /create account/i }));

      // HTML5 validation should prevent submission
      expect(authAPI.register).not.toHaveBeenCalled();
    });

    it("should trim name but email auto-trims from HTML5", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.register).mockResolvedValue({} as any);

      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), "  John Doe  ");
      await user.type(screen.getByLabelText(/email address/i), "  john@example.com  ");
      await user.type(screen.getByLabelText(/^password$/i), "Password123");
      await user.click(screen.getByRole("checkbox", { name: /terms of service/i }));

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith(
          "John Doe", // Trimmed by .trim()
          "john@example.com", // Auto-trimmed by type="email"
          "Password123"
        );
      });
    });
  });
});
