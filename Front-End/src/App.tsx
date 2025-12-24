import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import LessonView from "./pages/LessonView";
import QuizView from "./pages/QuizView";
import ChapterTestView from "./pages/ChapterTestView";
import FinalExamView from "./pages/FinalExamView";
import CertificateView from "./pages/CertificateView";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes (anyone can access) */}
          <Route path="/" element={<Landing />} />
          <Route path="/course" element={<CourseDetail />} />

          {/* Auth Routes (only non-logged-in users) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicOnlyRoute>
                <VerifyEmail />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicOnlyRoute>
                <ResetPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes (only logged-in users) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:id"
            element={
              <ProtectedRoute>
                <LessonView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:id/quiz"
            element={
              <ProtectedRoute>
                <QuizView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapter/:id/test"
            element={
              <ProtectedRoute>
                <ChapterTestView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id/exam"
            element={
              <ProtectedRoute>
                <FinalExamView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificate/:id"
            element={
              <ProtectedRoute>
                <CertificateView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
