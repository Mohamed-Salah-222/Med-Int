import axios from "axios";
import { LoginResponse, Lesson, Question, QuizAnswer, QuizSubmitResponse, DetailedProgress, TestSubmitResponse, ExamSubmitResponse, Certificate } from "../types";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) => api.post<LoginResponse>("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) => api.post("/auth/register", { name, email, password }),

  verifyEmail: (email: string, code: string) => api.post("/auth/verify", { email, verificationCode: code }),

  resendVerification: (email: string) => api.post("/auth/resend-verification", { email }),

  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) => api.post("/auth/reset-password", { token, newPassword: password }),
};

export const courseAPI = {
  getLesson: (id: string) => api.get<{ lesson: Lesson }>(`/courses/lessons/${id}`),

  getLessonQuiz: (id: string) => api.get<{ quiz: { questions: Question[]; totalQuestions: number; passingScore: number } }>(`/courses/lessons/${id}/quiz`),

  submitQuiz: (id: string, answers: QuizAnswer[]) => api.post<QuizSubmitResponse>(`/courses/lessons/${id}/submit-quiz`, { answers }),

  getCourse: (id: string) => api.get<{ course: { id: string; title: string; description: string; totalChapters: number; chapters: any[] } }>(`/courses/${id}`),

  getDetailedProgress: (courseId: string) => api.get<{ progress: DetailedProgress }>(`/courses/${courseId}/detailed-progress`),

  getChapterTest: (chapterId: string) => api.get<{ test: { questions: Question[]; totalQuestions: number; passingScore: number; timeLimit: number } }>(`/courses/chapters/${chapterId}/test`),

  submitChapterTest: (chapterId: string, answers: QuizAnswer[]) => api.post<TestSubmitResponse>(`/courses/chapters/${chapterId}/submit-test`, { answers }),

  getFinalExam: (courseId: string) => api.get<{ exam: { questions: Question[]; totalQuestions: number; passingScore: number; timeLimit: number } }>(`/courses/${courseId}/exam`),

  submitFinalExam: (courseId: string, answers: QuizAnswer[]) => api.post<ExamSubmitResponse>(`/courses/${courseId}/submit-exam`, { answers }),

  getCertificate: (courseId: string) => api.get<{ certificate: Certificate }>(`/courses/${courseId}/certificate`),
};

export default api;
