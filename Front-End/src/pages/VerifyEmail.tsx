import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authAPI } from "../services/api";

function VerifyEmail() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.verifyEmail(email, code);
      alert("Email verified successfully! You can now login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.resendVerification(email);
      alert("Verification code resent! Check your email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-2">Verify Email</h1>
        <p className="text-gray-600 mb-6">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Verification Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest" maxLength={6} placeholder="000000" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 mb-4">
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <button type="button" onClick={handleResend} className="w-full text-blue-600 hover:underline mb-4">
            Resend Code
          </button>

          <p className="text-center text-gray-600">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default VerifyEmail;
