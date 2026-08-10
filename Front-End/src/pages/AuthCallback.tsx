import { useEffect, useContext, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { getRedirectPathForRole } from "../utils/roleRedirect";

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  // The backend now hands over a single-use code rather than the JWT itself, so
  // no credential ends up in browser history, a Referer header, or an access log.
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Consuming the callback is a one-time action, so it is guarded by a ref
  // rather than by its dependencies. The effect previously depended on the
  // whole `auth` object, which loginWithToken itself replaces on the next
  // render — re-running the effect and re-issuing the request it had just
  // completed. The deps are also narrowed to the two values actually read.
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    if (error) {
      navigate("/login?error=oauth_failed");
      return;
    }

    if (!code) {
      navigate("/login");
      return;
    }

    // Exchange the one-time code for the JWT, then validate that JWT before
    // persisting anything. The token is handed to the validation request
    // explicitly, so nothing is written to storage until the server has
    // confirmed it — an invalid or tampered token never becomes the active
    // session. The exchange itself is single-use, so this whole block cannot
    // succeed twice even if the URL is revisited.
    authAPI
      .exchangeOAuthCode(code)
      .then(async (exchange) => {
        const token = exchange.data.token;

        const response = await authAPI.getCurrentUser(token);
        const user = response.data.user;

        // Persists via AuthContext, which syncs the token to localStorage.
        auth?.loginWithToken(token, user);

        navigate(getRedirectPathForRole(user.role));
      })
      .catch(() => {
        // Clear anything a previous session may have left behind, so a failed
        // sign-in never leaves a stale token sitting in storage.
        localStorage.removeItem("token");
        navigate("/login?error=oauth_failed");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A9D96] mx-auto mb-4"></div>
        <p className="text-[#6B6B6B]">Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
