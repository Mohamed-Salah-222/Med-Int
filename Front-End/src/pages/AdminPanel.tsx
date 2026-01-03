import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { BookOpen, Layers, FileText, HelpCircle, Settings, BarChart3, Users, Award } from "lucide-react";

function AdminPanel() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const isAuthorized = auth?.user?.role === "Admin" || auth?.user?.role === "SuperVisor";

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex items-center justify-center bg-[#FAFAF8] py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-[#6B6B6B] mb-6">You don't have permission to access this page.</p>
            <button onClick={() => navigate("/dashboard")} className="bg-[#7A9D96] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#6A8D86] transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const adminCards = [
    {
      title: "Courses",
      description: "Create and manage courses",
      icon: BookOpen,
      route: "/admin/courses",
    },
    {
      title: "Chapters",
      description: "Organize course chapters",
      icon: Layers,
      route: "/admin/chapters",
    },
    {
      title: "Lessons",
      description: "Create lesson content",
      icon: FileText,
      route: "/admin/lessons",
    },
    {
      title: "Questions",
      description: "Manage quiz, test & exam questions",
      icon: HelpCircle,
      route: "/admin/questions",
    },
    {
      title: "Statistics",
      description: "View platform analytics",
      icon: BarChart3,
      route: "/admin/stats",
    },
    {
      title: "Users",
      description: "Manage user accounts",
      icon: Users,
      route: "/admin/users",
    },
    {
      title: "Certificates",
      description: "View issued certificates",
      icon: Award,
      route: "/admin/certificates",
    },
    {
      title: "Settings",
      description: "Platform configuration",
      icon: Settings,
      route: "/admin/settings",
    },
  ];

  return (
    <Layout>
      <div className="bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-[#2C2C2C] mb-4" style={{ fontFamily: "Lexend, sans-serif" }}>
              Admin Panel
            </h1>
            <p className="text-xl text-[#6B6B6B]">
              Welcome back, <span className="font-semibold text-[#2C2C2C]">{auth?.user?.name}</span>. Manage your platform from here.
            </p>
          </div>

          {/* Admin Cards Grid - 4x2 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminCards.map((card) => (
              <button key={card.route} onClick={() => navigate(card.route)} className="bg-white rounded-2xl p-6 border-2 border-[#E8E8E6] hover:border-[#7A9D96] hover:shadow-lg transition-all duration-300 text-left group">
                <div className="w-14 h-14 rounded-xl bg-[#FAFAF8] border border-[#E8E8E6] flex items-center justify-center mb-4 group-hover:bg-[#7A9D96]/10 group-hover:border-[#7A9D96] transition-all">
                  <card.icon className="w-7 h-7 text-[#7A9D96]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-2 group-hover:text-[#7A9D96] transition-colors">{card.title}</h3>
                <p className="text-sm text-[#6B6B6B]">{card.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdminPanel;
