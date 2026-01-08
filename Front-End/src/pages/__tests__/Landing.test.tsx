import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Landing from "../Landing";
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
const renderLanding = (authValue: any = null) => {
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
        <Landing />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("Landing Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe("Loading State", () => {
    it("should show loading spinner when auth is loading", () => {
      const authValue = {
        user: null,
        token: null,
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: true,
      };

      renderLanding(authValue);

      // Check for the spinner by class
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Navigation - Not Logged In", () => {
    it("should show login and get started buttons when not logged in", () => {
      renderLanding();

      expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("should navigate to login page when login button clicked", async () => {
      const user = userEvent.setup();
      renderLanding();

      await user.click(screen.getByRole("button", { name: /^login$/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("should navigate to register page when get started clicked", async () => {
      const user = userEvent.setup();
      renderLanding();

      await user.click(screen.getByRole("button", { name: /get started/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/register");
    });
  });

  describe("Navigation - Logged In (Student)", () => {
    it("should show dashboard and logout buttons when logged in", () => {
      const authValue = {
        user: { role: "Student", name: "Test User" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      // More specific - look for the nav Dashboard button (not hero button)
      const dashboardButtons = screen.getAllByRole("button", { name: /dashboard/i });
      expect(dashboardButtons.length).toBeGreaterThan(0);

      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^login$/i })).not.toBeInTheDocument();
    });

    it("should navigate to dashboard when dashboard button clicked", async () => {
      const user = userEvent.setup();
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      // Click the first Dashboard button (nav button)
      const dashboardButtons = screen.getAllByRole("button", { name: /dashboard/i });
      await user.click(dashboardButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should not show admin button for students", () => {
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      expect(screen.queryByRole("button", { name: /admin/i })).not.toBeInTheDocument();
    });
  });

  describe("Navigation - Logged In (Admin)", () => {
    it("should show admin button for admin users", () => {
      const authValue = {
        user: { role: "Admin" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
    });

    it("should show admin button for supervisor users", () => {
      const authValue = {
        user: { role: "SuperVisor" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
    });

    it("should navigate to admin when admin button clicked", async () => {
      const user = userEvent.setup();
      const authValue = {
        user: { role: "Admin" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      await user.click(screen.getByRole("button", { name: /admin/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  describe("Logout Functionality", () => {
    it("should logout and redirect to home when logout clicked", async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: mockLogout,
        loading: false,
      };

      renderLanding(authValue);

      await user.click(screen.getByRole("button", { name: /logout/i }));

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Hero Section", () => {
    it("should render main heading and description", () => {
      renderLanding();

      expect(screen.getByRole("heading", { name: /save lives through accurate communication/i })).toBeInTheDocument();
      expect(screen.getByText(/become a certified medical interpreter/i)).toBeInTheDocument();
    });

    it('should show "Start Your Journey" button when not logged in', () => {
      renderLanding();

      expect(screen.getByRole("button", { name: /start your journey/i })).toBeInTheDocument();
    });

    it('should show "Go to Dashboard" button when logged in', () => {
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('should navigate to register when "Start Your Journey" clicked', async () => {
      const user = userEvent.setup();
      renderLanding();

      await user.click(screen.getByRole("button", { name: /start your journey/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/register");
    });

    it('should navigate to dashboard when "Go to Dashboard" clicked', async () => {
      const user = userEvent.setup();
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      await user.click(screen.getByRole("button", { name: /go to dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it('should navigate to course when "Explore Course" clicked', async () => {
      const user = userEvent.setup();
      renderLanding();

      await user.click(screen.getByRole("button", { name: /explore course/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/course");
    });
  });

  describe("Stats Section", () => {
    it("should display all stats", () => {
      renderLanding();

      expect(screen.getByText("$25-45")).toBeInTheDocument();
      expect(screen.getByText("20%")).toBeInTheDocument();
      expect(screen.getByText("AI-Proof")).toBeInTheDocument();
      expect(screen.getByText("Dual")).toBeInTheDocument();
    });
  });

  describe("Feature Sections", () => {
    it("should render critical importance section", () => {
      renderLanding();

      expect(screen.getByText(/untrained interpreters can cost lives/i)).toBeInTheDocument();
      expect(screen.getByText(/family members breach confidentiality/i)).toBeInTheDocument();
    });

    it("should render career and pay section", () => {
      renderLanding();

      expect(screen.getByText(/excellent pay in a secure, ai-proof field/i)).toBeInTheDocument();
      expect(screen.getByText(/high earning potential/i)).toBeInTheDocument();
    });

    it("should render certification section", () => {
      renderLanding();

      expect(screen.getByText(/earn a certificate that actually means something/i)).toBeInTheDocument();
      expect(screen.getByText(/lesson quizzes: 80% to pass/i)).toBeInTheDocument();
    });
  });

  describe("Final CTA Section", () => {
    it('should show "Enroll Now" button when not logged in', () => {
      renderLanding();

      const ctaButtons = screen.getAllByRole("button", { name: /enroll now/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('should show "Continue Learning" button when logged in', () => {
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      const ctaButtons = screen.getAllByRole("button", { name: /continue learning/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to register when "Enroll Now" clicked', async () => {
      const user = userEvent.setup();
      renderLanding();

      const enrollButton = screen.getAllByRole("button", { name: /enroll now/i })[0];
      await user.click(enrollButton);

      expect(mockNavigate).toHaveBeenCalledWith("/register");
    });

    it('should navigate to dashboard when "Continue Learning" clicked', async () => {
      const user = userEvent.setup();
      const authValue = {
        user: { role: "Student" },
        token: "test-token",
        login: vi.fn(),
        loginWithToken: vi.fn(),
        logout: vi.fn(),
        loading: false,
      };

      renderLanding(authValue);

      const continueButton = screen.getAllByRole("button", { name: /continue learning/i })[0];
      await user.click(continueButton);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Footer", () => {
    it("should render footer with brand and contact", () => {
      renderLanding();

      expect(screen.getByText(/professional medical interpreter training/i)).toBeInTheDocument();
      expect(screen.getByText(/support@medicalinterpreteracademy.com/i)).toBeInTheDocument();
    });

    it("should render footer links", () => {
      renderLanding();

      expect(screen.getByRole("heading", { name: /quick links/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /resources/i })).toBeInTheDocument();
    });

    it("should render copyright", () => {
      renderLanding();

      expect(screen.getByText(/© 2025 medical interpreter academy/i)).toBeInTheDocument();
    });
  });

  describe("Logo Navigation", () => {
    it("should navigate to home when logo clicked", async () => {
      const user = userEvent.setup();
      renderLanding();

      const logos = screen.getAllByText("Medical Interpreter Academy");
      await user.click(logos[0]); // Click the nav logo

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
