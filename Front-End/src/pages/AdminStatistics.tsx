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
          <div className="text-xl text-[#6B6B6B]">Loading statistics...</div>
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

  const COLORS = ["#3B82F6", "#8B5CF6", "#F97316"];

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Statistics & Analytics
            </h1>
            <p className="text-[#6B6B6B]">Platform performance and user activity insights</p>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" strokeWidth={2} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.overview.totalUsers}</div>
              <div className="text-sm text-[#6B6B6B]">Total Users</div>
              <div className="text-xs text-green-600 mt-2">+{stats.recentActivity.newUsers} this month</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.overview.certificatesIssued}</div>
              <div className="text-sm text-[#6B6B6B]">Certificates Issued</div>
              <div className="text-xs text-[#6B6B6B] mt-2">{stats.overview.completedCourses} courses completed</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-green-600" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.overview.totalQuestions}</div>
              <div className="text-sm text-[#6B6B6B]">Total Questions</div>
              <div className="text-xs text-[#6B6B6B] mt-2">
                {stats.questions.quiz} quiz · {stats.questions.test} test · {stats.questions.exam} exam
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2C2C2C] mb-1">{stats.attempts.quizzes.total + stats.attempts.tests.total + stats.attempts.exams.total}</div>
              <div className="text-sm text-[#6B6B6B]">Total Attempts</div>
              <div className="text-xs text-[#6B6B6B] mt-2">{stats.recentActivity.quizAttempts + stats.recentActivity.testAttempts + stats.recentActivity.examAttempts} this month</div>
            </div>
          </div>

          {/* Content Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white">
              <BookOpen className="w-8 h-8 mb-4" strokeWidth={2} />
              <div className="text-3xl font-bold mb-1">{stats.overview.totalCourses}</div>
              <div className="text-sm opacity-90">Active Courses</div>
            </div>

            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white">
              <Layers className="w-8 h-8 mb-4" strokeWidth={2} />
              <div className="text-3xl font-bold mb-1">{stats.overview.totalChapters}</div>
              <div className="text-sm opacity-90">Total Chapters</div>
            </div>

            <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white">
              <FileText className="w-8 h-8 mb-4" strokeWidth={2} />
              <div className="text-3xl font-bold mb-1">{stats.overview.totalLessons}</div>
              <div className="text-sm opacity-90">Total Lessons</div>
            </div>
          </div>

          {/* Attempts Statistics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Quizzes */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C2C2C]">Quiz Performance</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Total Attempts</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.quizzes.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Passed</span>
                  <span className="text-lg font-bold text-green-600 flex items-center">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.attempts.quizzes.passRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tests */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C2C2C]">Test Performance</h3>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Total Attempts</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.tests.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Passed</span>
                  <span className="text-lg font-bold text-green-600 flex items-center">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${stats.attempts.tests.passRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exams */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C2C2C]">Exam Performance</h3>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Total Attempts</span>
                  <span className="text-lg font-bold text-[#2C2C2C]">{stats.attempts.exams.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B6B6B]">Passed</span>
                  <span className="text-lg font-bold text-green-600 flex items-center">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${stats.attempts.exams.passRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Daily Activity Line Chart */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-[#7A9D96] mr-2" />
                <h3 className="text-lg font-bold text-[#2C2C2C]">Activity (Last 7 Days)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Quizzes" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Tests" stroke="#8B5CF6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Exams" stroke="#F97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pass Rate Bar Chart */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-[#7A9D96] mr-2" />
                <h3 className="text-lg font-bold text-[#2C2C2C]">Pass Rates Comparison</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={passRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#7A9D96" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Questions Distribution */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
            <div className="flex items-center mb-4">
              <HelpCircle className="w-5 h-5 text-[#7A9D96] mr-2" />
              <h3 className="text-lg font-bold text-[#2C2C2C]">Questions Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={questionsData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {questionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdminStatistics;
