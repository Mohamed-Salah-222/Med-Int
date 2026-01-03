import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      navigate("/login?error=oauth_failed");
      return;
    }

    if (token && auth?.loginWithToken) {
      // Changed from auth.login
      localStorage.setItem("token", token);

      fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          auth.loginWithToken(token, data.user); // Changed from auth.login

          // Smart redirect based on user role
          const userRole = data.user.role;

          if (userRole === "Admin" || userRole === "SuperVisor") {
            navigate("/admin");
          } else if (userRole === "Student") {
            navigate("/dashboard");
          } else if (userRole === "User") {
            navigate("/course");
          } else {
            navigate("/dashboard");
          }
        })
        .catch(() => {
          navigate("/login?error=oauth_failed");
        });
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, auth]);

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
