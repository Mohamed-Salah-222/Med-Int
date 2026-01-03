import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Users, BookOpen, Layers, FileText, HelpCircle, Award, TrendingUp, Activity, Target, CheckCircle, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Statistics {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalChapters: number;
    totalLessons: number;
    totalQuestions: number;
    completedCourses: number;
    certificatesIssued: number;
  };
  questions: {
    total: number;
    quiz: number;
    test: number;
    exam: number;
  };
  attempts: {
    quizzes: {
      total: number;
      passed: number;
      avgScore: number;
      passRate: number;
    };
    tests: {
      total: number;
      passed: number;
      avgScore: number;
      passRate: number;
    };
    exams: {
      total: number;
      passed: number;
      avgScore: number;
      passRate: number;
    };
  };
  recentActivity: {
    newUsers: number;
    quizAttempts: number;
    testAttempts: number;
    examAttempts: number;
  };
  dailyActivity: {
    date: string;
    quizzes: number;
    tests: number;
    exams: number;
  }[];
}

function AdminStatistics() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await adminAPI.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7A9D96] mx-auto mb-4"></div>
            <p className="text-xl text-[#6B6B6B] font-semibold">Loading statistics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-red-600">Failed to load statistics</div>
        </div>
      </Layout>
    );
  }

  // Chart Data
  const dailyActivityData = stats.dailyActivity.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Quizzes: d.quizzes,
    Tests: d.tests,
    Exams: d.exams,
  }));

  const passRateData = [
    { name: "Quizzes", rate: stats.attempts.quizzes.passRate },
    { name: "Tests", rate: stats.attempts.tests.passRate },
    { name: "Exams", rate: stats.attempts.exams.passRate },
  ];

  const questionsData = [
    { name: "Quiz", value: stats.questions.quiz },
    { name: "Test", value: stats.questions.test },
    { name: "Exam", value: stats.questions.exam },
  ];

  // Warm, professional colors matching your theme
  const CHART_COLORS = ["#7A9D96", "#E76F51", "#F4A261"];

  return (
    <Layout>
      <div className="bg-[#FAFAF8] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Statistics & Analytics
            </h1>
            <p className="text-[#6B6B6B]">Platform performance and user activity insights</p>
          </div>

          {/* Overview Cards - WARM THEME */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit">
                  <Users className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
                </div>
                <TrendingUp className="w-5 h-5 text-[#7A9D96]" />
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.overview.totalUsers}</div>
              <div className="text-sm text-[#6B6B6B]">Total Users</div>
              <div className="text-xs text-[#7A9D96] mt-2 font-semibold">+{stats.recentActivity.newUsers} this month</div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit">
                  <Award className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.overview.certificatesIssued}</div>
              <div className="text-sm text-[#6B6B6B]">Certificates Issued</div>
              <div className="text-xs text-[#6B6B6B] mt-2">{stats.overview.completedCourses} courses completed</div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit">
                  <HelpCircle className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.overview.totalQuestions}</div>
              <div className="text-sm text-[#6B6B6B]">Total Questions</div>
              <div className="text-xs text-[#6B6B6B] mt-2">
                {stats.questions.quiz} quiz · {stats.questions.test} test · {stats.questions.exam} exam
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-[#E8E8E6] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 w-fit">
                  <Activity className="w-6 h-6 text-[#7A9D96]" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.attempts.quizzes.total + stats.attempts.tests.total + stats.attempts.exams.total}</div>
              <div className="text-sm text-[#6B6B6B]">Total Attempts</div>
              <div className="text-xs text-[#6B6B6B] mt-2">{stats.recentActivity.quizAttempts + stats.recentActivity.testAttempts + stats.recentActivity.examAttempts} this month</div>
            </div>
          </div>

          {/* Content Stats - WARM GRADIENT */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-white/10 rounded-lg p-2 w-fit mb-4">
                <BookOpen className="w-6 h-6" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.overview.totalCourses}</div>
              <div className="text-sm opacity-90">Active Courses</div>
            </div>

            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-white/10 rounded-lg p-2 w-fit mb-4">
                <Layers className="w-6 h-6" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.overview.totalChapters}</div>
              <div className="text-sm opacity-90">Total Chapters</div>
            </div>

            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-white/10 rounded-lg p-2 w-fit mb-4">
                <FileText className="w-6 h-6" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.overview.totalLessons}</div>
              <div className="text-sm opacity-90">Total Lessons</div>
            </div>
          </div>

          {/* Attempts Statistics - REFINED */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Quizzes */}
            <div className="bg-white rounded-xl p-6 border border-[#E8E8E6] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C2C2C]">Quiz Performance</h3>
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <Target className="w-5 h-5 text-[#7A9D96]" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Total Attempts</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.quizzes.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Passed</span>
                  <span className="text-lg font-bold text-[#7A9D96] flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {stats.attempts.quizzes.passed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Average Score</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.quizzes.avgScore}%</span>
                </div>
                <div className="pt-3 border-t border-[#E8E8E6]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6B6B6B]">Pass Rate</span>
                    <span className="text-xs font-bold text-[#2C2C2C]">{stats.attempts.quizzes.passRate}%</span>
                  </div>
                  <div className="w-full bg-[#E8E8E6] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all" style={{ width: `${stats.attempts.quizzes.passRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tests */}
            <div className="bg-white rounded-xl p-6 border border-[#E8E8E6] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C2C2C]">Test Performance</h3>
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <Target className="w-5 h-5 text-[#7A9D96]" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Total Attempts</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.tests.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Passed</span>
                  <span className="text-lg font-bold text-[#7A9D96] flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {stats.attempts.tests.passed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Average Score</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.tests.avgScore}%</span>
                </div>
                <div className="pt-3 border-t border-[#E8E8E6]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6B6B6B]">Pass Rate</span>
                    <span className="text-xs font-bold text-[#2C2C2C]">{stats.attempts.tests.passRate}%</span>
                  </div>
                  <div className="w-full bg-[#E8E8E6] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all" style={{ width: `${stats.attempts.tests.passRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exams */}
            <div className="bg-white rounded-xl p-6 border border-[#E8E8E6] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C2C2C]">Exam Performance</h3>
                <div className="bg-[#7A9D96]/10 rounded-lg p-2">
                  <Target className="w-5 h-5 text-[#7A9D96]" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Total Attempts</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.exams.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Passed</span>
                  <span className="text-lg font-bold text-[#7A9D96] flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {stats.attempts.exams.passed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Average Score</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.exams.avgScore}%</span>
                </div>
                <div className="pt-3 border-t border-[#E8E8E6]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6B6B6B]">Pass Rate</span>
                    <span className="text-xs font-bold text-[#2C2C2C]">{stats.attempts.exams.passRate}%</span>
                  </div>
                  <div className="w-full bg-[#E8E8E6] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] h-2 rounded-full transition-all" style={{ width: `${stats.attempts.exams.passRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts - REFINED */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Activity Line Chart */}
            <div className="bg-white rounded-xl p-6 border border-[#E8E8E6] shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 mr-3">
                  <Calendar className="w-5 h-5 text-[#7A9D96]" />
                </div>
                <h3 className="text-lg font-bold text-[#2C2C2C]">Activity (Last 7 Days)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E6" />
                  <XAxis dataKey="date" stroke="#6B6B6B" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6B6B6B" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E8E8E6",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Quizzes" stroke="#7A9D96" strokeWidth={2} dot={{ fill: "#7A9D96" }} />
                  <Line type="monotone" dataKey="Tests" stroke="#E76F51" strokeWidth={2} dot={{ fill: "#E76F51" }} />
                  <Line type="monotone" dataKey="Exams" stroke="#F4A261" strokeWidth={2} dot={{ fill: "#F4A261" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pass Rate Bar Chart */}
            <div className="bg-white rounded-xl p-6 border border-[#E8E8E6] shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-[#7A9D96]/10 rounded-lg p-2 mr-3">
                  <Target className="w-5 h-5 text-[#7A9D96]" />
                </div>
                <h3 className="text-lg font-bold text-[#2C2C2C]">Pass Rates Comparison</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={passRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E6" />
                  <XAxis dataKey="name" stroke="#6B6B6B" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6B6B6B" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E8E8E6",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="rate" fill="#7A9D96" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Questions Distribution - REFINED */}
          <div className="bg-white rounded-xl p-6 border border-[#E8E8E6] shadow-sm">
            <div className="flex items-center mb-6">
              <div className="bg-[#7A9D96]/10 rounded-lg p-2 mr-3">
                <HelpCircle className="w-5 h-5 text-[#7A9D96]" />
              </div>
              <h3 className="text-lg font-bold text-[#2C2C2C]">Questions Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={questionsData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {questionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E8E8E6",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdminStatistics;
