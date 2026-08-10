import { createContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import { authAPI } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  // Resolves with the signed-in user. Callers that need to act on the user
  // (e.g. a role-based redirect) must use this value, because the `user` field
  // above is React state and is not updated synchronously by this call.
  login: (email: string, password: string) => Promise<User>;
  // Establishes a session from an already-issued token (the OAuth callback),
  // bypassing the email/password exchange.
  loginWithToken: (token: string, userData: User) => void;
  // Revokes the token server-side before clearing local state. Because
  // tokenVersion is per user, this ends the user's sessions on every device.
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Fetch user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          // Token is invalid, clear it
          setToken(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authAPI.login(email, password);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const loginWithToken = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    // Sent before local state is cleared, and with the token passed explicitly:
    // the request interceptor reads localStorage, so clearing first would make
    // this call unauthenticated and the server would never revoke the token.
    const currentToken = token ?? localStorage.getItem("token");

    try {
      if (currentToken) {
        await authAPI.logout(currentToken);
      }
    } catch {
      // Best effort. If the server is unreachable the local session is still
      // cleared below — the token then survives until it expires naturally,
      // which is no worse than the previous client-only behaviour.
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  return <AuthContext.Provider value={{ user, token, login, loginWithToken, logout, loading }}>{children}</AuthContext.Provider>;
};
