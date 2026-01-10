import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import VerifyCertificate from "../VerifyCertificate";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    verifyCertificate: vi.fn(),
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

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

// Mock data
const mockValidCertificate = {
  data: {
    valid: true,
    certificate: {
      certificateNumber: "MIC-2024-001",
      userName: "John Doe",
      courseTitle: "Medical Interpreter Training",
      completionDate: "2024-01-20T00:00:00Z",
      issuedAt: "2024-01-20T10:00:00Z",
    },
  },
};

const mockInvalidCertificate = {
  data: {
    valid: false,
    message: "Certificate not found or verification code is incorrect",
  },
};

// Helper to render with router and optional search params
const renderVerifyCertificate = (searchParams = "") => {
  const path = `/verify-certificate${searchParams}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <VerifyCertificate />
    </MemoryRouter>
  );
};

describe("VerifyCertificate Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAlert.mockClear();
  });

  describe("Header", () => {
    it("should display page title", () => {
      renderVerifyCertificate();

      expect(screen.getByText("Certificate Verification")).toBeInTheDocument();
      expect(screen.getByText(/verify the authenticity of medical interpreter certificates/i)).toBeInTheDocument();
    });
  });

  describe("Verification Form", () => {
    it("should display certificate number input", () => {
      renderVerifyCertificate();

      expect(screen.getByPlaceholderText(/mic-2026-abc123/i)).toBeInTheDocument();
    });

    it("should display verification code input", () => {
      renderVerifyCertificate();

      expect(screen.getByPlaceholderText(/a1b2c3d4/i)).toBeInTheDocument();
    });

    it("should display verify button", () => {
      renderVerifyCertificate();

      expect(screen.getByRole("button", { name: /verify certificate/i })).toBeInTheDocument();
    });

    it("should display instructions", () => {
      renderVerifyCertificate();

      expect(screen.getByText(/how to verify:/i)).toBeInTheDocument();
      expect(screen.getByText(/enter the certificate number found on the certificate/i)).toBeInTheDocument();
    });

    it("should have disabled button when fields are empty", () => {
      renderVerifyCertificate();

      expect(screen.getByRole("button", { name: /verify certificate/i })).toBeDisabled();
    });

    it("should enable button when both fields filled", async () => {
      const user = userEvent.setup();
      renderVerifyCertificate();

      const certInput = screen.getByPlaceholderText(/mic-2026-abc123/i);
      const codeInput = screen.getByPlaceholderText(/a1b2c3d4/i);

      await user.type(certInput, "MIC-2024-001");
      await user.type(codeInput, "ABC123");

      expect(screen.getByRole("button", { name: /verify certificate/i })).not.toBeDisabled();
    });
  });

  describe("Input Handling", () => {
    it("should convert certificate number to uppercase", async () => {
      const user = userEvent.setup();
      renderVerifyCertificate();

      const certInput = screen.getByPlaceholderText(/mic-2026-abc123/i);
      await user.type(certInput, "mic-2024-001");

      expect(certInput).toHaveValue("MIC-2024-001");
    });

    it("should convert verification code to uppercase", async () => {
      const user = userEvent.setup();
      renderVerifyCertificate();

      const codeInput = screen.getByPlaceholderText(/a1b2c3d4/i);
      await user.type(codeInput, "abc123");

      expect(codeInput).toHaveValue("ABC123");
    });
  });

  describe("Verification Process", () => {
    it("should verify certificate when button clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.verifyCertificate).mockResolvedValue(mockValidCertificate as any);

      renderVerifyCertificate();

      await user.type(screen.getByPlaceholderText(/mic-2026-abc123/i), "MIC-2024-001");
      await user.type(screen.getByPlaceholderText(/a1b2c3d4/i), "ABC123");
      await user.click(screen.getByRole("button", { name: /verify certificate/i }));

      await waitFor(() => {
        expect(courseAPI.verifyCertificate).toHaveBeenCalledWith("MIC-2024-001", "ABC123");
      });
    });
  });

  describe("Valid Certificate Result", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.verifyCertificate).mockResolvedValue(mockValidCertificate as any);

      renderVerifyCertificate();

      await user.type(screen.getByPlaceholderText(/mic-2026-abc123/i), "MIC-2024-001");
      await user.type(screen.getByPlaceholderText(/a1b2c3d4/i), "ABC123");
      await user.click(screen.getByRole("button", { name: /verify certificate/i }));
    });

    it("should display success message", async () => {
      await waitFor(() => {
        expect(screen.getByText(/certificate valid/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/this is an authentic certificate/i)).toBeInTheDocument();
    });

    it("should display certificate holder name", async () => {
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("Certificate Holder")).toBeInTheDocument();
    });

    it("should display course title", async () => {
      await waitFor(() => {
        expect(screen.getByText("Medical Interpreter Training")).toBeInTheDocument();
      });

      expect(screen.getByText("Course Title")).toBeInTheDocument();
    });

    it("should display certificate number", async () => {
      await waitFor(() => {
        expect(screen.getByText("MIC-2024-001")).toBeInTheDocument();
      });

      expect(screen.getByText("Certificate Number")).toBeInTheDocument();
    });

    it("should display completion date", async () => {
      await waitFor(() => {
        expect(screen.getByText(/january 20, 2024/i)).toBeInTheDocument();
      });

      expect(screen.getByText("Completion Date")).toBeInTheDocument();
    });

    it("should display verified badge", async () => {
      await waitFor(() => {
        expect(screen.getByText(/verified & authentic/i)).toBeInTheDocument();
      });
    });
  });

  describe("Invalid Certificate Result", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.verifyCertificate).mockRejectedValue({
        response: { status: 404 },
      });

      renderVerifyCertificate();

      await user.type(screen.getByPlaceholderText(/mic-2026-abc123/i), "INVALID-001");
      await user.type(screen.getByPlaceholderText(/a1b2c3d4/i), "WRONG");
      await user.click(screen.getByRole("button", { name: /verify certificate/i }));
    });

    it("should display error message", async () => {
      await waitFor(() => {
        const notFoundTexts = screen.getAllByText(/certificate not found/i);
        expect(notFoundTexts.length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/this certificate could not be verified/i)).toBeInTheDocument();
    });

    it("should display verification failed message", async () => {
      await waitFor(() => {
        expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/certificate not found or verification code is incorrect/i)).toBeInTheDocument();
    });

    it("should display possible reasons", async () => {
      await waitFor(() => {
        expect(screen.getByText(/possible reasons:/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/the certificate number or verification code was entered incorrectly/i)).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should show verify another button after verification", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.verifyCertificate).mockResolvedValue(mockValidCertificate as any);

      renderVerifyCertificate();

      await user.type(screen.getByPlaceholderText(/mic-2026-abc123/i), "MIC-2024-001");
      await user.type(screen.getByPlaceholderText(/a1b2c3d4/i), "ABC123");
      await user.click(screen.getByRole("button", { name: /verify certificate/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /verify another certificate/i })).toBeInTheDocument();
      });
    });

    it("should reset form when verify another clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.verifyCertificate).mockResolvedValue(mockValidCertificate as any);

      renderVerifyCertificate();

      await user.type(screen.getByPlaceholderText(/mic-2026-abc123/i), "MIC-2024-001");
      await user.type(screen.getByPlaceholderText(/a1b2c3d4/i), "ABC123");
      await user.click(screen.getByRole("button", { name: /verify certificate/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /verify another certificate/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /verify another certificate/i }));

      // Form should be back
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/mic-2026-abc123/i)).toBeInTheDocument();
      });
    });

    it("should navigate to home when back button clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.verifyCertificate).mockResolvedValue(mockValidCertificate as any);

      renderVerifyCertificate();

      await user.type(screen.getByPlaceholderText(/mic-2026-abc123/i), "MIC-2024-001");
      await user.type(screen.getByPlaceholderText(/a1b2c3d4/i), "ABC123");
      await user.click(screen.getByRole("button", { name: /verify certificate/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /back to home/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /back to home/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("URL Parameters Auto-fill", () => {
    it("should auto-fill and verify from URL params", async () => {
      vi.mocked(courseAPI.verifyCertificate).mockResolvedValue(mockValidCertificate as any);

      renderVerifyCertificate("?certificateNumber=MIC-2024-001&verificationCode=ABC123");

      await waitFor(() => {
        expect(courseAPI.verifyCertificate).toHaveBeenCalledWith("MIC-2024-001", "ABC123");
      });
    });
  });
});
