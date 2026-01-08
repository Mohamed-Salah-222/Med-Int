import { renderHook, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { AuthProvider, AuthContext } from "../AuthContext";
import { authAPI } from "../../services/api";
import type { AxiosResponse } from "axios";
import { useContext } from "react";

// Mock the API
vi.mock("../../services/api", () => ({
  authAPI: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Helper to create mock Axios response
const createMockAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {
    headers: {} as any,
  },
});

// Helper hook to use AuthContext in tests
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should provide initial values when no token exists", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for loading to complete (don't check loading immediately)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it("should fetch user when token exists in localStorage", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "Student" as const,
      };

      localStorageMock.setItem("token", "existing-token");
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(createMockAxiosResponse({ user: mockUser }));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authAPI.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe("existing-token");
    });

    it("should clear invalid token from localStorage on fetch error", async () => {
      localStorageMock.setItem("token", "invalid-token");
      vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error("Unauthorized"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch user:", expect.any(Error));
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(localStorageMock.getItem("token")).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe("Login Function", () => {
    it("should login successfully and set user and token", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "Student" as const,
      };

      vi.mocked(authAPI.login).mockResolvedValue(
        createMockAxiosResponse({
          token: "new-token",
          user: mockUser,
        })
      );

      // Mock getCurrentUser to prevent token from being cleared
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(createMockAxiosResponse({ user: mockUser }));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.token).toBe("new-token");
      });

      expect(authAPI.login).toHaveBeenCalledWith("test@example.com", "password123");
      expect(result.current.user).toEqual(mockUser);
      expect(localStorageMock.getItem("token")).toBe("new-token");
    });

    it("should save token to localStorage after login", async () => {
      const mockUser = {
        id: "2",
        email: "user@test.com",
        name: "User",
        role: "User" as const,
      };

      vi.mocked(authAPI.login).mockResolvedValue(
        createMockAxiosResponse({
          token: "saved-token",
          user: mockUser,
        })
      );

      // Mock getCurrentUser to prevent token from being cleared
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(createMockAxiosResponse({ user: mockUser }));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login("user@test.com", "pass");
      });

      // Wait for localStorage to update
      await waitFor(() => {
        expect(localStorageMock.getItem("token")).toBe("saved-token");
      });
    });

    it("should throw error when login fails", async () => {
      vi.mocked(authAPI.login).mockRejectedValue(new Error("Invalid credentials"));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login("wrong@example.com", "wrongpass");
        })
      ).rejects.toThrow("Invalid credentials");

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe("LoginWithToken Function (OAuth)", () => {
    it("should set user and token directly", async () => {
      const mockUser = {
        id: "3",
        email: "oauth@example.com",
        name: "OAuth User",
        role: "Student" as const,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.loginWithToken("oauth-token", mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe("oauth-token");
      expect(localStorageMock.getItem("token")).toBe("oauth-token");
    });

    it("should not call API when using loginWithToken", async () => {
      const mockUser = {
        id: "4",
        email: "direct@example.com",
        name: "Direct User",
        role: "Admin" as const,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const loginCallCount = vi.mocked(authAPI.login).mock.calls.length;

      act(() => {
        result.current.loginWithToken("direct-token", mockUser);
      });

      expect(vi.mocked(authAPI.login).mock.calls.length).toBe(loginCallCount);
      expect(result.current.token).toBe("direct-token");
    });
  });

  describe("Logout Function", () => {
    it("should clear user, token, and localStorage", async () => {
      const mockUser = {
        id: "5",
        email: "logout@example.com",
        name: "Logout User",
        role: "Student" as const,
      };

      vi.mocked(authAPI.login).mockResolvedValue(
        createMockAxiosResponse({
          token: "logout-token",
          user: mockUser,
        })
      );

      // Mock getCurrentUser to prevent token from being cleared
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(createMockAxiosResponse({ user: mockUser }));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login("logout@example.com", "pass");
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(result.current.token).toBe("logout-token");
      });

      expect(result.current.user).toEqual(mockUser);
      expect(localStorageMock.getItem("token")).toBe("logout-token");

      // Now logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorageMock.getItem("token")).toBeNull();
    });

    it("should work even when not logged in", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Logout without logging in
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe("Token Synchronization", () => {
    it("should sync token to localStorage when token changes", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockUser = {
        id: "6",
        email: "sync@example.com",
        name: "Sync User",
        role: "User" as const,
      };

      act(() => {
        result.current.loginWithToken("sync-token", mockUser);
      });

      expect(localStorageMock.getItem("token")).toBe("sync-token");
    });

    it("should remove token from localStorage when token becomes null", async () => {
      localStorageMock.setItem("token", "to-be-removed");

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.getItem("token")).toBeNull();
    });
  });

  describe("Multiple Login/Logout Cycles", () => {
    it("should handle multiple login/logout cycles correctly", async () => {
      const mockUser1 = {
        id: "7",
        email: "user1@example.com",
        name: "User 1",
        role: "Student" as const,
      };

      const mockUser2 = {
        id: "8",
        email: "user2@example.com",
        name: "User 2",
        role: "Admin" as const,
      };

      vi.mocked(authAPI.login)
        .mockResolvedValueOnce(createMockAxiosResponse({ token: "token1", user: mockUser1 }))
        .mockResolvedValueOnce(createMockAxiosResponse({ token: "token2", user: mockUser2 }));

      // Mock getCurrentUser for both logins
      vi.mocked(authAPI.getCurrentUser)
        .mockResolvedValueOnce(createMockAxiosResponse({ user: mockUser1 }))
        .mockResolvedValueOnce(createMockAxiosResponse({ user: mockUser2 }));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First login
      await act(async () => {
        await result.current.login("user1@example.com", "pass1");
      });

      // Wait for first login to complete
      await waitFor(() => {
        expect(result.current.token).toBe("token1");
      });

      expect(result.current.user).toEqual(mockUser1);

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();

      // Second login
      await act(async () => {
        await result.current.login("user2@example.com", "pass2");
      });

      // Wait for second login to complete
      await waitFor(() => {
        expect(result.current.token).toBe("token2");
      });

      expect(result.current.user).toEqual(mockUser2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle getCurrentUser returning null user", async () => {
      localStorageMock.setItem("token", "token-with-null-user");
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(createMockAxiosResponse({ user: null as any }));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBe("token-with-null-user");
    });

    it("should handle empty string token in localStorage", async () => {
      localStorageMock.setItem("token", "");

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Empty string is falsy, so no API call should be made
      expect(authAPI.getCurrentUser).not.toHaveBeenCalled();
    });

    it("should handle network errors during initial user fetch", async () => {
      localStorageMock.setItem("token", "network-error-token");
      vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error("Network error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(localStorageMock.getItem("token")).toBeNull();

      consoleSpy.mockRestore();
    });

    it("should throw error when useAuth is used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Context Provider", () => {
    it("should provide all required context values", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("token");
      expect(result.current).toHaveProperty("login");
      expect(result.current).toHaveProperty("loginWithToken");
      expect(result.current).toHaveProperty("logout");
      expect(result.current).toHaveProperty("loading");
    });

    it("should have correct function types", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.login).toBe("function");
      expect(typeof result.current.loginWithToken).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });
  });
});
