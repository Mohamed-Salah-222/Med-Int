import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResetPassword from "../ResetPassword";
import { authAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  authAPI: {
    resetPassword: vi.fn(),
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

// Helper to render with router and token
const renderResetPassword = (token: string = "valid-token") => {
  return render(
    <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ResetPassword Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe("Initial Render", () => {
    it("should render all form fields", () => {
      renderResetPassword();

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
    });

    it("should render logo that navigates to home", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      const logo = screen.getByText("Medical Interpreter Academy");
      await user.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("should have new password input focused on load", () => {
      renderResetPassword();

      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveFocus();
    });

    it("should show error when no token provided", () => {
      render(
        <MemoryRouter initialEntries={["/reset-password"]}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
    });

    it("should disable form when no token provided", () => {
      render(
        <MemoryRouter initialEntries={["/reset-password"]}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/new password/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      expect(screen.getByRole("button", { name: /reset password/i })).toBeDisabled();
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle new password visibility", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      const passwordInput = screen.getByLabelText(/new password/i);
      const toggleButtons = screen.getAllByRole("button", { name: "" });

      expect(passwordInput).toHaveAttribute("type", "password");

      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute("type", "text");

      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should toggle confirm password visibility", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      const confirmInput = screen.getByLabelText(/confirm password/i);
      const toggleButtons = screen.getAllByRole("button", { name: "" });

      expect(confirmInput).toHaveAttribute("type", "password");

      await user.click(toggleButtons[1]);
      expect(confirmInput).toHaveAttribute("type", "text");

      await user.click(toggleButtons[1]);
      expect(confirmInput).toHaveAttribute("type", "password");
    });
  });

  describe("Password Strength Indicator", () => {
    it("should not show strength indicator when password is empty", () => {
      renderResetPassword();

      expect(screen.queryByText(/use 8\+ chars/i)).not.toBeInTheDocument();
    });

    it("should show strength indicator when typing password", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "weak");

      expect(screen.getByText(/use 8\+ chars with uppercase, lowercase & number/i)).toBeInTheDocument();
    });

    it("should calculate weak password strength", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "weak");

      const strengthBar = screen.getByLabelText(/new password/i).parentElement?.parentElement?.querySelector(".bg-red-500");
      expect(strengthBar).toBeInTheDocument();
    });

    it("should calculate strong password strength", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "StrongPass123!");

      const strengthBar = screen.getByLabelText(/new password/i).parentElement?.parentElement?.querySelector(".bg-emerald-600");
      expect(strengthBar).toBeInTheDocument();
    });
  });

  describe("Password Match Indicator", () => {
    it("should not show match indicator when confirm password is empty", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "Password123");

      expect(screen.queryByText(/passwords match/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/passwords don't match/i)).not.toBeInTheDocument();
    });

    it("should show match indicator when passwords match", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "Password123");
      await user.type(screen.getByLabelText(/confirm password/i), "Password123");

      expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
    });

    it("should show mismatch indicator when passwords do not match", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "Password123");
      await user.type(screen.getByLabelText(/confirm password/i), "Different123");

      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when passwords do not match on submit attempt", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "Password123");
      await user.type(screen.getByLabelText(/confirm password/i), "Password123");

      // Clear confirm and type different password
      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.clear(confirmInput);
      await user.type(confirmInput, "Different123");

      // Button should be disabled, so this won't actually submit
      const submitButton = screen.getByRole("button", { name: /reset password/i });
      expect(submitButton).toBeDisabled();

      // Verify the mismatch indicator is shown
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });

    it("should show error for weak password", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "weak");
      await user.type(screen.getByLabelText(/confirm password/i), "weak");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should show error for password without uppercase", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "password123");
      await user.type(screen.getByLabelText(/confirm password/i), "password123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should show error for password without lowercase", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "PASSWORD123");
      await user.type(screen.getByLabelText(/confirm password/i), "PASSWORD123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should show error for password without number", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "Password");
      await user.type(screen.getByLabelText(/confirm password/i), "Password");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should disable submit button when passwords do not match", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "Password123");
      await user.type(screen.getByLabelText(/confirm password/i), "Different123");

      expect(screen.getByRole("button", { name: /reset password/i })).toBeDisabled();
    });
  });

  describe("Successful Password Reset", () => {
    it("should reset password and show success screen", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockResolvedValue({} as any);

      renderResetPassword("test-token");

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(authAPI.resetPassword).toHaveBeenCalledWith("test-token", "NewPassword123");
      });

      await waitFor(() => {
        expect(screen.getByText(/password reset!/i)).toBeInTheDocument();
        expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
      });
    });

    it("should redirect to login after successful reset", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockResolvedValue({} as any);

      renderResetPassword("test-token");

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/login");
        },
        { timeout: 3000 }
      );
    });

    it("should show loading state during reset", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/resetting password/i)).toBeInTheDocument();
      });
    });

    it("should disable form during reset", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeDisabled();
        expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      });
    });
  });

  describe("Reset Password Errors", () => {
    it("should show error message when reset fails", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockRejectedValue({
        response: { data: { message: "Token expired" } },
      });

      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText("Token expired")).toBeInTheDocument();
      });
    });

    it("should show generic error when no message provided", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockRejectedValue(new Error("Network error"));

      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
      });
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resetPassword).mockRejectedValue({
        response: { data: { message: "Error" } },
      });

      renderResetPassword();

      await user.type(screen.getByLabelText(/new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/new password/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).not.toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission", async () => {
      const user = userEvent.setup();
      renderResetPassword();

      await user.click(screen.getByRole("button", { name: /reset password/i }));

      // HTML5 validation should prevent submission
      expect(authAPI.resetPassword).not.toHaveBeenCalled();
    });
  });
});
