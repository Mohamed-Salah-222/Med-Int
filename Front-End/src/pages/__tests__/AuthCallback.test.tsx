import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import AuthCallback from "../AuthCallback";
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

// Helper to render with AuthContext and specific URL
const renderAuthCallback = (authValue: any = null, initialEntries = ["/auth-callback"]) => {
  const defaultAuthValue = {
    user: null,
    token: null,
    login: vi.fn(),
    loginWithToken: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue || defaultAuthValue}>
        <AuthCallback />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("AuthCallback Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Mock global fetch
    global.fetch = vi.fn();
    // Clear localStorage
    localStorage.clear();
    // Mock VITE_API_URL
    vi.stubEnv("VITE_API_URL", "http://localhost:5000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should show loading spinner initially", () => {
    renderAuthCallback();
    expect(screen.getByText(/completing sign in/i)).toBeInTheDocument();
  });

  describe("Error Handling", () => {
    it("should redirect to login if error parameter is present", async () => {
      renderAuthCallback(null, ["/auth-callback?error=access_denied"]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
    });

    it("should redirect to login if no token is present", async () => {
      renderAuthCallback(null, ["/auth-callback"]); // No params

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Successful OAuth Flow", () => {
    const mockToken = "fake-google-token";
    const mockUser = { _id: "123", email: "test@test.com", role: "Student" };

    it("should fetch user data, store token, and call loginWithToken", async () => {
      const mockLoginWithToken = vi.fn();

      // Mock successful fetch response
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ user: mockUser }),
      });

      renderAuthCallback({ loginWithToken: mockLoginWithToken }, [`/auth-callback?token=${mockToken}`]);

      await waitFor(() => {
        expect(localStorage.getItem("token")).toBe(mockToken);
        expect(mockLoginWithToken).toHaveBeenCalledWith(mockToken, mockUser);
      });
    });

    it("should redirect Student to /dashboard", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ user: { role: "Student" } }),
      });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?token=${mockToken}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should redirect Admin to /admin", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ user: { role: "Admin" } }),
      });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?token=${mockToken}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });
    });

    it("should redirect User to /course", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ user: { role: "User" } }),
      });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?token=${mockToken}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/course");
      });
    });
  });

  describe("API Failure", () => {
    it("should redirect to login with error if API call fails", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      renderAuthCallback({ loginWithToken: vi.fn() }, ["/auth-callback?token=some-token"]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
    });
  });
});
