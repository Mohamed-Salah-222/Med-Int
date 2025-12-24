export interface User {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Admin" | "SuperVisor";
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Lesson {
  id: string;
  title: string;
  lessonNumber: number;
  content: string;
  contentType: "text" | "audio-exercise";
  audioUrl?: string;
}

export interface Question {
  _id: string;
  questionText: string;
  options: string[];
  type: "quiz" | "test" | "exam";
  difficulty?: "easy" | "medium" | "hard";
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
}

export interface QuizResult {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizSubmitResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  results: QuizResult[];
}

export interface LessonProgress {
  lessonId: string;
  lessonNumber: number;
  title: string;
  completed: boolean;
  quizScore: number;
  attempts: number;
  completedAt: string | null;
}

export interface ChapterProgress {
  chapterId: string;
  chapterNumber: number;
  title: string;
  totalLessons: number;
  completedLessons: number;
  allLessonsCompleted: boolean;
  testTaken: boolean;
  testPassed: boolean;
  testScore: number | null;
  testAttemptedAt: string | null;
  lessons: LessonProgress[];
}

export interface NextAction {
  type: "lesson" | "chapter-test" | "final-exam" | "completed";
  chapterNumber?: number;
  lessonNumber?: number;
  title?: string;
  message: string;
}

export interface DetailedProgress {
  currentChapter: number;
  currentLesson: number;
  courseCompleted: boolean;
  certificateIssued: boolean;
  completedAt: string | null;
  chapters: ChapterProgress[];
  finalExam: {
    attempts: any[];
    passed: boolean;
    bestScore: number;
  };
  nextAction: NextAction | null;
}

export interface TestSubmitResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  results: QuizResult[];
}

export interface ExamSubmitResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  courseCompleted: boolean;
  certificateIssued: boolean;
  certificates?: {
    main: {
      certificateNumber: string;
      verificationCode: string;
      issuedAt: string;
    };
    hipaa: {
      certificateNumber: string;
      verificationCode: string;
      issuedAt: string;
    };
  };
  results: QuizResult[];
}
