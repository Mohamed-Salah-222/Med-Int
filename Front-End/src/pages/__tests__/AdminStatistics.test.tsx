import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminStatistics from "../AdminStatistics";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getStatistics: vi.fn(),
  },
}));

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock data
const mockStatisticsData = {
  data: {
    overview: {
      totalUsers: 1250,
      totalCourses: 12,
      totalChapters: 45,
      totalLessons: 180,
      totalQuestions: 450,
      completedCourses: 328,
      certificatesIssued: 328,
    },
    questions: {
      total: 450,
      quiz: 200,
      test: 150,
      exam: 100,
    },
    attempts: {
      quizzes: {
        total: 5000,
        passed: 4200,
        avgScore: 85,
        passRate: 84,
      },
      tests: {
        total: 2000,
        passed: 1500,
        avgScore: 78,
        passRate: 75,
      },
      exams: {
        total: 800,
        passed: 640,
        avgScore: 82,
        passRate: 80,
      },
    },
    recentActivity: {
      newUsers: 45,
      quizAttempts: 320,
      testAttempts: 120,
      examAttempts: 50,
    },
    dailyActivity: [
      { date: "2024-01-14", quizzes: 50, tests: 20, exams: 8 },
      { date: "2024-01-15", quizzes: 45, tests: 18, exams: 7 },
      { date: "2024-01-16", quizzes: 52, tests: 22, exams: 9 },
      { date: "2024-01-17", quizzes: 48, tests: 19, exams: 6 },
      { date: "2024-01-18", quizzes: 55, tests: 25, exams: 10 },
      { date: "2024-01-19", quizzes: 50, tests: 21, exams: 8 },
      { date: "2024-01-20", quizzes: 20, tests: 15, exams: 2 },
    ],
  },
};

// Helper to render with router
const renderAdminStatistics = () => {
  return render(
    <MemoryRouter>
      <AdminStatistics />
    </MemoryRouter>
  );
};

describe("AdminStatistics Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminAPI.getStatistics).mockResolvedValue(mockStatisticsData as any);
  });

  describe("Loading State", () => {
    it("should show loading message while fetching", () => {
      vi.mocked(adminAPI.getStatistics).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminStatistics();

      expect(screen.getByText(/loading statistics/i)).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error message when fetch fails", async () => {
      vi.mocked(adminAPI.getStatistics).mockRejectedValue(new Error("Failed"));

      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText(/failed to load statistics/i)).toBeInTheDocument();
      });
    });
  });

  describe("Header", () => {
    it("should render page header", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText(/statistics & analytics/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/platform performance and user activity/i)).toBeInTheDocument();
    });
  });

  describe("Overview Cards", () => {
    it("should display total users", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("1250")).toBeInTheDocument();
      });

      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText(/\+45 this month/i)).toBeInTheDocument();
    });

    it("should display certificates issued", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("328")).toBeInTheDocument();
      });

      expect(screen.getByText("Certificates Issued")).toBeInTheDocument();
      expect(screen.getByText(/328 courses completed/i)).toBeInTheDocument();
    });

    it("should display total questions", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("450")).toBeInTheDocument();
      });

      expect(screen.getByText("Total Questions")).toBeInTheDocument();
      expect(screen.getByText(/200 quiz · 150 test · 100 exam/i)).toBeInTheDocument();
    });

    it("should display total attempts", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("7800")).toBeInTheDocument(); // 5000 + 2000 + 800
      });

      const totalAttemptsLabels = screen.getAllByText("Total Attempts");
      expect(totalAttemptsLabels.length).toBe(4); // Overview card + 3 performance cards
      expect(screen.getByText(/490 this month/i)).toBeInTheDocument(); // 320 + 120 + 50
    });
  });

  describe("Content Stats", () => {
    it("should display active courses", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("12")).toBeInTheDocument();
      });

      expect(screen.getByText("Active Courses")).toBeInTheDocument();
    });

    it("should display total chapters", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("45")).toBeInTheDocument();
      });

      expect(screen.getByText("Total Chapters")).toBeInTheDocument();
    });

    it("should display total lessons", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("180")).toBeInTheDocument();
      });

      expect(screen.getByText("Total Lessons")).toBeInTheDocument();
    });
  });

  describe("Performance Cards", () => {
    it("should display quiz performance", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("Quiz Performance")).toBeInTheDocument();
      });

      expect(screen.getByText("5000")).toBeInTheDocument(); // Total attempts
      expect(screen.getByText("4200")).toBeInTheDocument(); // Passed
      expect(screen.getByText("85%")).toBeInTheDocument(); // Avg score
      const passRates = screen.getAllByText("84%");
      expect(passRates.length).toBeGreaterThan(0); // Pass rate
    });

    it("should display test performance", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("Test Performance")).toBeInTheDocument();
      });

      expect(screen.getByText("2000")).toBeInTheDocument(); // Total attempts
      expect(screen.getByText("1500")).toBeInTheDocument(); // Passed
      expect(screen.getByText("78%")).toBeInTheDocument(); // Avg score
      expect(screen.getByText("75%")).toBeInTheDocument(); // Pass rate
    });

    it("should display exam performance", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText("Exam Performance")).toBeInTheDocument();
      });

      expect(screen.getByText("800")).toBeInTheDocument(); // Total attempts
      expect(screen.getByText("640")).toBeInTheDocument(); // Passed
      expect(screen.getByText("82%")).toBeInTheDocument(); // Avg score
      expect(screen.getByText("80%")).toBeInTheDocument(); // Pass rate
    });
  });

  describe("Charts", () => {
    it("should render daily activity chart", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText(/activity \(last 7 days\)/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("should render pass rates chart", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText(/pass rates comparison/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("should render questions distribution chart", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(screen.getByText(/questions distribution/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  describe("API Calls", () => {
    it("should fetch statistics on mount", async () => {
      renderAdminStatistics();

      await waitFor(() => {
        expect(adminAPI.getStatistics).toHaveBeenCalled();
      });
    });
  });
});
