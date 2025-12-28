import axios from "axios";
import { LoginResponse, Lesson, Question, QuizAnswer, QuizSubmitResponse, DetailedProgress, TestSubmitResponse, ExamSubmitResponse, Certificate, User } from "../types";

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

  getCurrentUser: () => api.get<{ user: User }>("/auth/me"),
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

  getCertificates: (courseId: string) => api.get<{ certificates: { main: Certificate | null; hipaa: Certificate | null } }>(`/courses/${courseId}/certificates`),
};

export const adminAPI = {
  // Courses
  getAllCourses: () => api.get("/admin/courses"),
  getCourseById: (id: string) => api.get(`/admin/courses/${id}`),
  createCourse: (data: { title: string; description: string; totalChapters: number }) => api.post("/admin/courses", data),
  updateCourse: (id: string, data: any) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/admin/courses/${id}`),

  // Chapters
  getAllChapters: (courseId?: string) => api.get("/admin/chapters", { params: courseId ? { courseId } : {} }),
  getChapterById: (id: string) => api.get(`/admin/chapters/${id}`),
  createChapter: (data: { courseId: string; title: string; description: string; chapterNumber: number }) => api.post("/admin/chapters", data),
  updateChapter: (id: string, data: any) => api.put(`/admin/chapters/${id}`, data),
  deleteChapter: (id: string) => api.delete(`/admin/chapters/${id}`),

  // Lessons
  getAllLessons: (chapterId?: string) => api.get("/admin/lessons", { params: chapterId ? { chapterId } : {} }),
  getLessonById: (id: string) => api.get(`/admin/lessons/${id}`),
  createLesson: (data: { chapterId: string; title: string; lessonNumber: number; content: string; contentType?: string }) => api.post("/admin/lessons", data),
  updateLesson: (id: string, data: any) => api.put(`/admin/lessons/${id}`, data),
  deleteLesson: (id: string) => api.delete(`/admin/lessons/${id}`),

  // Questions
  getAllQuestions: (type?: string) => api.get("/admin/questions", { params: type ? { type } : {} }),
  getQuestionById: (id: string) => api.get(`/admin/questions/${id}`),
  createQuestion: (data: { questionText: string; options: string[]; correctAnswer: string; type: "quiz" | "test" | "exam"; explanation?: string; audioUrl?: string; difficulty?: "easy" | "medium" | "hard" }) => api.post("/admin/questions", data),
  updateQuestion: (id: string, data: any) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/admin/questions/${id}`),
};

export default api;
