import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AuthCallback from "../AuthCallback";
import { AuthContext } from "../../context/AuthContext";
import { authAPI } from "../../services/api";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

//* The component authenticates through the axios wrapper, not global.fetch.
vi.mock("../../services/api", () => ({
  authAPI: {
    getCurrentUser: vi.fn(),
    exchangeOAuthCode: vi.fn(),
  },
}));

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

//* The happy path is now two calls: exchange the one-time code for a JWT, then
//* validate that JWT before anything is persisted.
const EXCHANGED_TOKEN = "jwt-from-exchange";

const mockUserResponse = (user: object, token = EXCHANGED_TOKEN) => {
  vi.mocked(authAPI.exchangeOAuthCode).mockResolvedValue({ data: { token, user } } as any);
  vi.mocked(authAPI.getCurrentUser).mockResolvedValue({ data: { user } } as any);
};

//* 64 hex chars, matching what the backend issues and its validator accepts.
const mockCode = "a".repeat(64);

describe("AuthCallback Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
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

    it("should not validate anything when an error parameter is present", async () => {
      renderAuthCallback(null, ["/auth-callback?error=access_denied"]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
      expect(authAPI.getCurrentUser).not.toHaveBeenCalled();
      expect(authAPI.exchangeOAuthCode).not.toHaveBeenCalled();
    });

    it("should redirect to login if no code is present", async () => {
      renderAuthCallback(null, ["/auth-callback"]); // No params

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Successful OAuth Flow", () => {
    const mockUser = { _id: "123", email: "test@test.com", role: "Student" };

    it("should exchange the code and call loginWithToken with the returned JWT", async () => {
      const mockLoginWithToken = vi.fn();
      mockUserResponse(mockUser);

      renderAuthCallback({ loginWithToken: mockLoginWithToken }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(mockLoginWithToken).toHaveBeenCalledWith(EXCHANGED_TOKEN, mockUser);
      });
    });

    it("should send the one-time code to the exchange endpoint", async () => {
      mockUserResponse(mockUser);

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(authAPI.exchangeOAuthCode).toHaveBeenCalledWith(mockCode);
      });
    });

    it("should validate the exchanged token explicitly rather than relying on stored state", async () => {
      mockUserResponse(mockUser);

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(authAPI.getCurrentUser).toHaveBeenCalledWith(EXCHANGED_TOKEN);
      });
    });

    it("should never put the JWT in the URL", async () => {
      mockUserResponse(mockUser);

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(authAPI.exchangeOAuthCode).toHaveBeenCalled();
      });
      //* The credential arrives in a response body, never as a query parameter.
      expect(mockCode).not.toBe(EXCHANGED_TOKEN);
    });

    it("should not write the token to storage before it is validated", async () => {
      let tokenAtRequestTime: string | null = "not-checked";
      vi.mocked(authAPI.exchangeOAuthCode).mockResolvedValue({ data: { token: EXCHANGED_TOKEN, user: mockUser } } as any);
      vi.mocked(authAPI.getCurrentUser).mockImplementation(async () => {
        //* Captured at the moment the validation request is made.
        tokenAtRequestTime = localStorage.getItem("token");
        return { data: { user: mockUser } } as any;
      });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(authAPI.getCurrentUser).toHaveBeenCalled();
      });
      expect(tokenAtRequestTime).toBeNull();
    });

    it("should exchange the code only once even if the auth context changes", async () => {
      mockUserResponse(mockUser);
      //* loginWithToken replaces the context value, which used to re-fire the effect.
      const { rerender } = render(
        <MemoryRouter initialEntries={[`/auth-callback?code=${mockCode}`]}>
          <AuthContext.Provider value={{ loginWithToken: vi.fn() } as any}>
            <AuthCallback />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(authAPI.exchangeOAuthCode).toHaveBeenCalledTimes(1);
      });

      rerender(
        <MemoryRouter initialEntries={[`/auth-callback?code=${mockCode}`]}>
          <AuthContext.Provider value={{ loginWithToken: vi.fn(), user: mockUser, token: EXCHANGED_TOKEN } as any}>
            <AuthCallback />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      //* Critical: the code is single-use, so a second exchange would fail with
      //* 400 and strand the user on the callback screen.
      await waitFor(() => {
        expect(authAPI.exchangeOAuthCode).toHaveBeenCalledTimes(1);
      });
    });

    it("should redirect Student to /dashboard", async () => {
      mockUserResponse({ role: "Student" });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should redirect Admin to /admin", async () => {
      mockUserResponse({ role: "Admin" });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });
    });

    it("should redirect SuperVisor to /admin", async () => {
      mockUserResponse({ role: "SuperVisor" });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });
    });

    it("should redirect User to /course", async () => {
      mockUserResponse({ role: "User" });

      renderAuthCallback({ loginWithToken: vi.fn() }, [`/auth-callback?code=${mockCode}`]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/course");
      });
    });
  });

  describe("API Failure", () => {
    const mockUser = { _id: "123", email: "test@test.com", role: "Student" };

    it("should redirect to login with error if the exchange fails", async () => {
      //* What a replayed or expired code looks like from the client: 400.
      vi.mocked(authAPI.exchangeOAuthCode).mockRejectedValue(new Error("400"));

      renderAuthCallback({ loginWithToken: vi.fn() }, ["/auth-callback?code=" + mockCode]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
    });

    it("should not persist anything when a reused code is rejected", async () => {
      const mockLoginWithToken = vi.fn();
      vi.mocked(authAPI.exchangeOAuthCode).mockRejectedValue(new Error("400"));

      renderAuthCallback({ loginWithToken: mockLoginWithToken }, ["/auth-callback?code=" + mockCode]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
      expect(localStorage.getItem("token")).toBeNull();
      expect(mockLoginWithToken).not.toHaveBeenCalled();
      expect(authAPI.getCurrentUser).not.toHaveBeenCalled();
    });

    it("should redirect to login with error if validation fails", async () => {
      vi.mocked(authAPI.exchangeOAuthCode).mockResolvedValue({ data: { token: EXCHANGED_TOKEN, user: mockUser } } as any);
      vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error("Network error"));

      renderAuthCallback({ loginWithToken: vi.fn() }, ["/auth-callback?code=" + mockCode]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
    });

    it("should not persist an invalid token", async () => {
      const mockLoginWithToken = vi.fn();
      vi.mocked(authAPI.exchangeOAuthCode).mockResolvedValue({ data: { token: EXCHANGED_TOKEN, user: mockUser } } as any);
      vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error("401"));

      renderAuthCallback({ loginWithToken: mockLoginWithToken }, ["/auth-callback?code=" + mockCode]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
      expect(localStorage.getItem("token")).toBeNull();
      expect(mockLoginWithToken).not.toHaveBeenCalled();
    });

    it("should clear a pre-existing stale token on failure", async () => {
      localStorage.setItem("token", "stale-token-from-before");
      vi.mocked(authAPI.exchangeOAuthCode).mockRejectedValue(new Error("400"));

      renderAuthCallback({ loginWithToken: vi.fn() }, ["/auth-callback?code=" + mockCode]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login?error=oauth_failed");
      });
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
