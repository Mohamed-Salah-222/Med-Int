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
import AdminPanel from "./pages/AdminPanel";
import AdminCourses from "./pages/AdminCourses";
import AdminChapters from "./pages/AdminChapters";
import AdminLessons from "./pages/AdminLessons";
import AdminQuestions from "./pages/AdminQuestions";
import AdminStatistics from "./pages/AdminStatistics";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminCertificates from "./pages/AdminCertificates";
import AdminSettings from "./pages/AdminSettings";

import VerifyCertificate from "./pages/VerifyCertificate";

import AuthCallback from "./pages/AuthCallback";

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

          {/* Student Routes (require Student role or higher) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireStudent={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:id"
            element={
              <ProtectedRoute requireStudent={true}>
                <LessonView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:id/quiz"
            element={
              <ProtectedRoute requireStudent={true}>
                <QuizView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapter/:id/test"
            element={
              <ProtectedRoute requireStudent={true}>
                <ChapterTestView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id/exam"
            element={
              <ProtectedRoute requireStudent={true}>
                <FinalExamView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificate/:id"
            element={
              <ProtectedRoute requireStudent={true}>
                <CertificateView />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes (require Admin/SuperVisor role) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chapters"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminChapters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lessons"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminStatistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUserDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/certificates"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-certificate" element={<VerifyCertificate />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
