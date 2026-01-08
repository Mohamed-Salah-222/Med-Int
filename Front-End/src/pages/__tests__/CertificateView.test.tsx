import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CertificateView from "../CertificateView";
import { courseAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  courseAPI: {
    getCertificates: vi.fn(),
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

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock certificates data
const mockCertificatesData = {
  data: {
    certificates: {
      main: {
        certificateNumber: "MC-2024-001234",
        verificationCode: "VERIFY123",
        userName: "John Doe",
        courseTitle: "Medical Interpreter Training",
        completionDate: "2024-01-15T00:00:00Z",
        finalExamScore: 95,
        issuedAt: "2024-01-15T10:00:00Z",
        certificateImageUrl: "https://example.com/cert-main.png",
      },
      hipaa: {
        certificateNumber: "HC-2024-001234",
        verificationCode: "VERIFY456",
        userName: "John Doe",
        courseTitle: "HIPAA Compliance Training",
        completionDate: "2024-01-15T00:00:00Z",
        finalExamScore: 100,
        issuedAt: "2024-01-15T10:00:00Z",
        certificateImageUrl: "https://example.com/cert-hipaa.png",
      },
    },
  },
};

const mockCertificatesWithoutImages = {
  data: {
    certificates: {
      main: {
        ...mockCertificatesData.data.certificates.main,
        certificateImageUrl: undefined,
      },
      hipaa: {
        ...mockCertificatesData.data.certificates.hipaa,
        certificateImageUrl: undefined,
      },
    },
  },
};

// Helper to render with router
const renderCertificateView = (courseId: string = "course-1") => {
  return render(
    <MemoryRouter initialEntries={[`/certificate/${courseId}`]}>
      <Routes>
        <Route path="/certificate/:id" element={<CertificateView />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("CertificateView Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockWindowOpen.mockClear();
    vi.mocked(courseAPI.getCertificates).mockResolvedValue(mockCertificatesData as any);
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching certificates", () => {
      vi.mocked(courseAPI.getCertificates).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderCertificateView();

      expect(screen.getByText(/loading certificates/i)).toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("should show 404 error message when certificates not found", async () => {
      vi.mocked(courseAPI.getCertificates).mockRejectedValue({
        response: { status: 404 },
      });

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/certificates not found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/complete the course to earn your certificates/i)).toBeInTheDocument();
    });

    it("should show generic error message for other errors", async () => {
      vi.mocked(courseAPI.getCertificates).mockRejectedValue(new Error("API Error"));

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/failed to load certificates/i)).toBeInTheDocument();
      });
    });

    it("should show error when no certificates available", async () => {
      vi.mocked(courseAPI.getCertificates).mockResolvedValue({
        data: { certificates: { main: null, hipaa: null } },
      } as any);

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/no certificates found/i)).toBeInTheDocument();
      });
    });

    it("should navigate to dashboard from error state", async () => {
      const user = userEvent.setup();
      vi.mocked(courseAPI.getCertificates).mockRejectedValue({
        response: { status: 404 },
      });

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /back to dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Success Banner", () => {
    it("should show congratulations message", async () => {
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/congratulations!/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/successfully completed the medical interpretation course/i)).toBeInTheDocument();
    });
  });

  describe("Main Certificate Display", () => {
    it("should display main certificate with all details", async () => {
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/medical interpreter certificate/i)).toBeInTheDocument();
      });

      expect(screen.getByText("MC-2024-001234")).toBeInTheDocument();
      expect(screen.getByText("VERIFY123")).toBeInTheDocument();
      expect(screen.getByText("95%")).toBeInTheDocument();

      // Date appears multiple times (both certificates)
      const dates = screen.getAllByText(/january 15, 2024/i);
      expect(dates.length).toBeGreaterThan(0);
    });

    it("should display main certificate image when available", async () => {
      renderCertificateView();

      await waitFor(() => {
        const img = screen.getByAltText(/medical interpreter certificate/i);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "https://example.com/cert-main.png");
      });
    });

    it("should show message when certificate image not available", async () => {
      vi.mocked(courseAPI.getCertificates).mockResolvedValue(mockCertificatesWithoutImages as any);

      renderCertificateView();

      await waitFor(() => {
        const messages = screen.getAllByText(/certificate image not available/i);
        expect(messages.length).toBeGreaterThan(0);
      });
    });
  });

  describe("HIPAA Certificate Display", () => {
    it("should display HIPAA certificate with all details", async () => {
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/hipaa compliance certificate/i)).toBeInTheDocument();
      });

      expect(screen.getByText("HC-2024-001234")).toBeInTheDocument();
      expect(screen.getByText("VERIFY456")).toBeInTheDocument();

      // "Valid" appears in status badge and "Lifetime Validity" section
      const validText = screen.getAllByText(/valid/i);
      expect(validText.length).toBeGreaterThan(0);
    });

    it("should display HIPAA certificate image when available", async () => {
      renderCertificateView();

      await waitFor(() => {
        const img = screen.getByAltText(/hipaa compliance certificate/i);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "https://example.com/cert-hipaa.png");
      });
    });
  });

  describe("Certificate Download", () => {
    it("should download main certificate when button clicked", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["fake image"], { type: "image/png" });
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const createObjectURL = vi.fn(() => "blob:mock-url");
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/medical interpreter certificate/i)).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole("button", { name: /download certificate/i });
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("https://example.com/cert-main.png");
        expect(createObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
      });
    });

    it("should download HIPAA certificate when button clicked", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["fake image"], { type: "image/png" });
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const createObjectURL = vi.fn(() => "blob:mock-url");
      global.URL.createObjectURL = createObjectURL;

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/hipaa compliance certificate/i)).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole("button", { name: /download certificate/i });
      await user.click(downloadButtons[1]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("https://example.com/cert-hipaa.png");
      });
    });

    it("should show alert when certificate image not available for download", async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.mocked(courseAPI.getCertificates).mockResolvedValue(mockCertificatesWithoutImages as any);

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/medical interpreter certificate/i)).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole("button", { name: /download certificate/i });
      await user.click(downloadButtons[0]);

      expect(alertSpy).toHaveBeenCalledWith("Certificate image not available");

      alertSpy.mockRestore();
    });

    it("should handle download error gracefully", async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error("Download failed"));

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/medical interpreter certificate/i)).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole("button", { name: /download certificate/i });
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to download certificate. Please try again.");
      });

      alertSpy.mockRestore();
    });
  });

  describe("Certificate Verification", () => {
    it("should open verification page for main certificate", async () => {
      const user = userEvent.setup();
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/medical interpreter certificate/i)).toBeInTheDocument();
      });

      const verifyButtons = screen.getAllByRole("button", { name: /verify certificate/i });
      await user.click(verifyButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith("/verify-certificate?certificateNumber=MC-2024-001234&verificationCode=VERIFY123", "_blank");
    });

    it("should open verification page for HIPAA certificate", async () => {
      const user = userEvent.setup();
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/hipaa compliance certificate/i)).toBeInTheDocument();
      });

      const verifyButtons = screen.getAllByRole("button", { name: /verify certificate/i });
      await user.click(verifyButtons[1]);

      expect(mockWindowOpen).toHaveBeenCalledWith("/verify-certificate?certificateNumber=HC-2024-001234&verificationCode=VERIFY456", "_blank");
    });
  });

  describe("Certificate Information Section", () => {
    it("should display certificate features", async () => {
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/about your certificates/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/digital certificates/i)).toBeInTheDocument();
      expect(screen.getByText(/qr code verification/i)).toBeInTheDocument();
      expect(screen.getByText(/secure storage/i)).toBeInTheDocument();
      expect(screen.getByText(/lifetime validity/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate back to dashboard when button clicked", async () => {
      const user = userEvent.setup();
      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/congratulations!/i)).toBeInTheDocument();
      });

      const backButtons = screen.getAllByRole("button", { name: /back to dashboard/i });
      await user.click(backButtons[backButtons.length - 1]);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Single Certificate Scenarios", () => {
    it("should display only main certificate when HIPAA not available", async () => {
      vi.mocked(courseAPI.getCertificates).mockResolvedValue({
        data: {
          certificates: {
            main: mockCertificatesData.data.certificates.main,
            hipaa: null,
          },
        },
      } as any);

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/medical interpreter certificate/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/hipaa compliance certificate/i)).not.toBeInTheDocument();
    });

    it("should display only HIPAA certificate when main not available", async () => {
      vi.mocked(courseAPI.getCertificates).mockResolvedValue({
        data: {
          certificates: {
            main: null,
            hipaa: mockCertificatesData.data.certificates.hipaa,
          },
        },
      } as any);

      renderCertificateView();

      await waitFor(() => {
        expect(screen.getByText(/hipaa compliance certificate/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/medical interpreter certificate/i)).not.toBeInTheDocument();
    });
  });

  describe("API Call", () => {
    it("should call getCertificates with correct course ID", async () => {
      renderCertificateView("course-123");

      await waitFor(() => {
        expect(courseAPI.getCertificates).toHaveBeenCalledWith("course-123");
      });
    });
  });
});
