import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminSettings from "../AdminSettings";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    testEmail: vi.fn(),
  },
}));

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock alert
const mockAlert = vi.fn();
window.alert = mockAlert;

// Mock data
const mockSettingsData = {
  data: {
    settings: {
      id: "settings-1",
      platformName: "Medical Interpreter Training",
      supportEmail: "support@medinterpreter.com",
      timezone: "America/New_York",
      maintenanceMode: false,
      defaultQuizPassingScore: 80,
      defaultTestPassingScore: 70,
      defaultExamPassingScore: 80,
      defaultTestCooldownHours: 3,
      defaultExamCooldownHours: 24,
      unlimitedQuizRetries: true,
      smtpConfigured: true,
      emailNotificationsEnabled: true,
      certificatePrefix: "MIC-2024-",
      autoIssueCertificates: true,
      certificateTemplate: "default",
      lastBackupDate: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-20T10:30:00Z",
    },
    systemStats: {
      totalUsers: 1250,
      totalCourses: 12,
      totalQuestions: 450,
      totalCertificates: 328,
      apiVersion: "v1.2.3",
      nodeVersion: "v18.17.0",
      uptime: 259200, // 3 days
    },
  },
};

// Helper to render with router
const renderAdminSettings = () => {
  return render(
    <MemoryRouter>
      <AdminSettings />
    </MemoryRouter>
  );
};

describe("AdminSettings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
    vi.mocked(adminAPI.getSettings).mockResolvedValue(mockSettingsData as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getSettings).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminSettings();

      expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
      });

      expect(screen.getByText(/configure platform settings/i)).toBeInTheDocument();
    });
  });

  describe("Platform Settings", () => {
    it("should display platform settings section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Platform Settings")).toBeInTheDocument();
      });
    });

    it("should show pre-filled platform values", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Medical Interpreter Training")).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue("support@medinterpreter.com")).toBeInTheDocument();
    });

    it("should show timezone dropdown", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByDisplayValue(/eastern time/i)).toBeInTheDocument();
      });
    });

    it("should show maintenance mode toggle", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Maintenance Mode")).toBeInTheDocument();
      });

      expect(screen.getByText(/disable user access temporarily/i)).toBeInTheDocument();
    });
  });

  describe("Course Settings", () => {
    it("should display course settings section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Course Settings")).toBeInTheDocument();
      });
    });

    it("should show passing score inputs", async () => {
      renderAdminSettings();

      await waitFor(() => {
        const scoreInputs = screen.getAllByDisplayValue("80");
        expect(scoreInputs.length).toBe(2); // Quiz and Exam both default to 80
      });

      expect(screen.getByDisplayValue("70")).toBeInTheDocument(); // Test score
    });

    it("should show cooldown inputs", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByDisplayValue("3")).toBeInTheDocument(); // Test cooldown
      });

      expect(screen.getByDisplayValue("24")).toBeInTheDocument(); // Exam cooldown
    });

    it("should show unlimited retries toggle", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Unlimited Quiz Retries")).toBeInTheDocument();
      });

      expect(screen.getByText(/allow students to retry quizzes/i)).toBeInTheDocument();
    });
  });

  describe("Email Settings", () => {
    it("should display email settings section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Email Settings")).toBeInTheDocument();
      });
    });

    it("should show SMTP configured toggle", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("SMTP Configured")).toBeInTheDocument();
      });

      expect(screen.getByText(/email server is set up/i)).toBeInTheDocument();
    });

    it("should show email notifications toggle", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Email Notifications")).toBeInTheDocument();
      });

      expect(screen.getByText(/send automated emails/i)).toBeInTheDocument();
    });

    it("should have test email button", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /send test email/i })).toBeInTheDocument();
      });
    });

    it("should send test email when button clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.testEmail).mockResolvedValue({ data: {} } as any);

      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /send test email/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /send test email/i }));

      await waitFor(() => {
        expect(adminAPI.testEmail).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith("Test email sent successfully!");
      });
    });
  });

  describe("Certificate Settings", () => {
    it("should display certificate settings section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Certificate Settings")).toBeInTheDocument();
      });
    });

    it("should show certificate prefix input", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByDisplayValue("MIC-2024-")).toBeInTheDocument();
      });
    });

    it("should show certificate template dropdown", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByDisplayValue(/default template/i)).toBeInTheDocument();
      });
    });

    it("should show auto-issue certificates toggle", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Auto-Issue Certificates")).toBeInTheDocument();
      });

      expect(screen.getByText(/automatically issue certificates/i)).toBeInTheDocument();
    });
  });

  describe("System Stats", () => {
    it("should display system stats section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("System Stats")).toBeInTheDocument();
      });
    });

    it("should show all stat values", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("1250")).toBeInTheDocument(); // Total users
      });

      expect(screen.getByText("12")).toBeInTheDocument(); // Total courses
      expect(screen.getByText("450")).toBeInTheDocument(); // Total questions
      expect(screen.getByText("328")).toBeInTheDocument(); // Certificates
    });

    it("should show stat labels", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText(/total users/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/total courses/i)).toBeInTheDocument();
      expect(screen.getByText(/total questions/i)).toBeInTheDocument();
      expect(screen.getByText(/certificates issued/i)).toBeInTheDocument();
    });
  });

  describe("System Info", () => {
    it("should display system info section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("System Info")).toBeInTheDocument();
      });
    });

    it("should show API version", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("v1.2.3")).toBeInTheDocument();
      });
    });

    it("should show Node version", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("v18.17.0")).toBeInTheDocument();
      });
    });

    it("should show formatted uptime", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText(/3d 0h 0m/i)).toBeInTheDocument();
      });
    });

    it("should show last backup date", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText(/1\/15\/2024/i)).toBeInTheDocument();
      });
    });
  });

  describe("Save Settings", () => {
    it("should update settings when form submitted", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateSettings).mockResolvedValue({ data: {} } as any);

      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Medical Interpreter Training")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Medical Interpreter Training");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Platform");

      const saveButton = screen.getByRole("button", { name: /save all settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(adminAPI.updateSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            platformName: "Updated Platform",
          })
        );
      });
    });

    it("should show success message after save", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateSettings).mockResolvedValue({ data: {} } as any);

      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save all settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /save all settings/i }));

      await waitFor(() => {
        expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
      });
    });

    it("should show error message on save failure", async () => {
      const user = userEvent.setup();
      vi.mocked(adminAPI.updateSettings).mockRejectedValue({
        response: { data: { message: "Failed to save" } },
      });

      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save all settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /save all settings/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeInTheDocument();
      });
    });
  });

  describe("Quick Actions", () => {
    it("should display quick actions section", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      });
    });

    it("should refresh settings when button clicked", async () => {
      const user = userEvent.setup();
      renderAdminSettings();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /refresh settings/i })).toBeInTheDocument();
      });

      // Clear the initial call
      vi.clearAllMocks();

      await user.click(screen.getByRole("button", { name: /refresh settings/i }));

      await waitFor(() => {
        expect(adminAPI.getSettings).toHaveBeenCalled();
      });
    });
  });

  describe("API Calls", () => {
    it("should fetch settings on mount", async () => {
      renderAdminSettings();

      await waitFor(() => {
        expect(adminAPI.getSettings).toHaveBeenCalled();
      });
    });
  });
});
