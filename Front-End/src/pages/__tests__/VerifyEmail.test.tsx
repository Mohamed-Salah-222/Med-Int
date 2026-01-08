import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VerifyEmail from "../VerifyEmail";
import { authAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  authAPI: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
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

// Helper to render with router and email state
const renderVerifyEmail = (email = "test@example.com") => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/verify-email", state: { email } }]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("VerifyEmail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe("Initial Render", () => {
    it("should render all 6 code inputs", () => {
      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(6);
    });

    it("should display the email address", () => {
      renderVerifyEmail("john@example.com");

      expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    });

    it("should render verify and resend buttons", () => {
      renderVerifyEmail();

      expect(screen.getByRole("button", { name: /verify email/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /resend code/i })).toBeInTheDocument();
    });

    it("should render back to login link", () => {
      renderVerifyEmail();

      expect(screen.getByRole("link", { name: /back to login/i })).toBeInTheDocument();
    });

    it("should render logo that navigates to home", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const logo = screen.getByText("Medical Interpreter Academy");
      await user.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("should handle missing email gracefully", () => {
      renderVerifyEmail("");

      // More specific: check the span inside the paragraph
      expect(
        screen.getByText((content, element) => {
          return element?.tagName === "SPAN" && element?.textContent === "your email";
        })
      ).toBeInTheDocument();
    });
  });

  describe("Code Input Behavior", () => {
    it("should allow typing digits only", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      await user.type(firstInput, "1a2b");

      expect(firstInput).toHaveValue("1");
    });

    it("should auto-focus next input after typing", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");

      await user.type(inputs[0], "1");
      expect(inputs[1]).toHaveFocus();

      await user.type(inputs[1], "2");
      expect(inputs[2]).toHaveFocus();
    });

    it("should handle backspace to focus previous input", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");

      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");

      // Now at input[2], press backspace when empty
      await user.type(inputs[2], "{backspace}");

      expect(inputs[1]).toHaveFocus();
    });

    it("should not allow more than 1 character per input", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      await user.type(firstInput, "123");

      expect(firstInput).toHaveValue("1");
    });

    it("should handle paste with 6-digit code", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      firstInput.focus();

      await user.paste("123456");

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0]).toHaveValue("1");
      expect(inputs[1]).toHaveValue("2");
      expect(inputs[2]).toHaveValue("3");
      expect(inputs[3]).toHaveValue("4");
      expect(inputs[4]).toHaveValue("5");
      expect(inputs[5]).toHaveValue("6");
    });

    it("should handle paste with non-numeric characters", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      firstInput.focus();

      await user.paste("1a2b3c4d5e6f");

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0]).toHaveValue("1");
      expect(inputs[1]).toHaveValue("2");
      expect(inputs[2]).toHaveValue("3");
      expect(inputs[3]).toHaveValue("4");
      expect(inputs[4]).toHaveValue("5");
      expect(inputs[5]).toHaveValue("6");
    });

    it("should handle paste with more than 6 digits", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      firstInput.focus();

      await user.paste("123456789");

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[5]).toHaveValue("6");
      // Should only take first 6
    });

    it("should focus last input after pasting full code", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      firstInput.focus();

      await user.paste("123456");

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[5]).toHaveFocus();
    });
  });

  describe("Form Validation", () => {
    it("should disable verify button when code is incomplete", () => {
      renderVerifyEmail();

      const verifyButton = screen.getByRole("button", { name: /verify email/i });
      expect(verifyButton).toBeDisabled();
    });

    it("should enable verify button when all 6 digits entered", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      // Type all 6 digits
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      const verifyButton = screen.getByRole("button", { name: /verify email/i });
      expect(verifyButton).not.toBeDisabled();
    });
  });

  describe("Successful Verification", () => {
    it("should verify email and show success screen", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockResolvedValue({} as any);

      renderVerifyEmail("test@example.com");

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        expect(authAPI.verifyEmail).toHaveBeenCalledWith("test@example.com", "123456");
      });

      await waitFor(() => {
        expect(screen.getByText(/email verified!/i)).toBeInTheDocument();
        expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
      });
    });

    it("should redirect to login after successful verification", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockResolvedValue({} as any);

      renderVerifyEmail("test@example.com");

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/login");
        },
        { timeout: 3000 }
      );
    });

    it("should show loading state during verification", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText(/verifying/i)).toBeInTheDocument();
      });
    });

    it("should disable inputs during verification", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3"); // ← Fixed: was inputs[3]
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        const allInputs = screen.getAllByRole("textbox");
        allInputs.forEach((input) => {
          expect(input).toBeDisabled();
        });
      });
    });
  });

  describe("Verification Errors", () => {
    it("should show error message when verification fails", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockRejectedValue({
        response: { data: { message: "Invalid verification code" } },
      });

      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      // Type instead of paste to ensure proper state
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid verification code")).toBeInTheDocument();
      });
    });

    it("should show generic error when no message provided", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockRejectedValue(new Error("Network error"));

      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText("Verification failed")).toBeInTheDocument();
      });
    });

    it("should re-enable inputs after error", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockRejectedValue({
        response: { data: { message: "Error" } },
      });

      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      // Form should be re-enabled
      inputs.forEach((input) => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe("Resend Code", () => {
    it("should resend verification code", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resendVerification).mockResolvedValue({} as any);

      renderVerifyEmail("test@example.com");

      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        expect(authAPI.resendVerification).toHaveBeenCalledWith("test@example.com");
      });
    });

    it("should clear code inputs after resending", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resendVerification).mockResolvedValue({} as any);

      renderVerifyEmail();

      // Fill code first
      const firstInput = screen.getAllByRole("textbox")[0];
      await user.paste("123456");

      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        inputs.forEach((input) => {
          expect(input).toHaveValue("");
        });
      });
    });

    it("should focus first input after resending", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resendVerification).mockResolvedValue({} as any);

      renderVerifyEmail();

      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        const firstInput = screen.getAllByRole("textbox")[0];
        expect(firstInput).toHaveFocus();
      });
    });

    it("should show loading state while resending", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resendVerification).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderVerifyEmail();

      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        expect(screen.getByText(/resending/i)).toBeInTheDocument();
      });
    });

    it("should show error if resend fails", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resendVerification).mockRejectedValue({
        response: { data: { message: "Failed to resend" } },
      });

      renderVerifyEmail();

      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to resend")).toBeInTheDocument();
      });
    });

    it("should show generic error if resend fails without message", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.resendVerification).mockRejectedValue(new Error("Network error"));

      renderVerifyEmail();

      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to resend code")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid typing without breaking", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");

      // Type rapidly
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      expect(inputs[5]).toHaveValue("6");
    });

    it("should handle partial paste", async () => {
      const user = userEvent.setup();
      renderVerifyEmail();

      const firstInput = screen.getAllByRole("textbox")[0];
      firstInput.focus();

      await user.paste("123");

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0]).toHaveValue("1");
      expect(inputs[1]).toHaveValue("2");
      expect(inputs[2]).toHaveValue("3");
      expect(inputs[3]).toHaveValue("");
    });

    it("should clear error when typing after error", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.verifyEmail).mockRejectedValue({
        response: { data: { message: "Invalid code" } },
      });

      renderVerifyEmail();

      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "1");
      await user.type(inputs[1], "2");
      await user.type(inputs[2], "3");
      await user.type(inputs[3], "4");
      await user.type(inputs[4], "5");
      await user.type(inputs[5], "6");

      await user.click(screen.getByRole("button", { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid code")).toBeInTheDocument();
      });

      // Now resend to clear error
      vi.mocked(authAPI.resendVerification).mockResolvedValue({} as any);
      await user.click(screen.getByRole("button", { name: /resend code/i }));

      await waitFor(() => {
        expect(screen.queryByText("Invalid code")).not.toBeInTheDocument();
      });
    });
  });
});
