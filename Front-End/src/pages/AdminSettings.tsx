import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../services/api";
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle, Globe, Mail, Clock, Award, Target, RefreshCw, Database, Server, Zap } from "lucide-react";

interface Settings {
  id: string;
  platformName: string;
  supportEmail: string;
  timezone: string;
  maintenanceMode: boolean;
  defaultQuizPassingScore: number;
  defaultTestPassingScore: number;
  defaultExamPassingScore: number;
  defaultTestCooldownHours: number;
  defaultExamCooldownHours: number;
  unlimitedQuizRetries: boolean;
  smtpConfigured: boolean;
  emailNotificationsEnabled: boolean;
  certificatePrefix: string;
  autoIssueCertificates: boolean;
  certificateTemplate: string;
  lastBackupDate: string | null;
  updatedAt: string;
}

interface SystemStats {
  totalUsers: number;
  totalCourses: number;
  totalQuestions: number;
  totalCertificates: number;
  apiVersion: string;
  nodeVersion: string;
  uptime: number;
}

function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultQuizPassingScore, setDefaultQuizPassingScore] = useState(80);
  const [defaultTestPassingScore, setDefaultTestPassingScore] = useState(70);
  const [defaultExamPassingScore, setDefaultExamPassingScore] = useState(80);
  const [defaultTestCooldownHours, setDefaultTestCooldownHours] = useState(3);
  const [defaultExamCooldownHours, setDefaultExamCooldownHours] = useState(24);
  const [unlimitedQuizRetries, setUnlimitedQuizRetries] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [certificatePrefix, setCertificatePrefix] = useState("");
  const [autoIssueCertificates, setAutoIssueCertificates] = useState(true);
  const [certificateTemplate, setCertificateTemplate] = useState("default");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      const data = response.data;

      setSettings(data.settings);
      setSystemStats(data.systemStats);

      // Populate form
      setPlatformName(data.settings.platformName);
      setSupportEmail(data.settings.supportEmail);
      setTimezone(data.settings.timezone);
      setMaintenanceMode(data.settings.maintenanceMode);
      setDefaultQuizPassingScore(data.settings.defaultQuizPassingScore);
      setDefaultTestPassingScore(data.settings.defaultTestPassingScore);
      setDefaultExamPassingScore(data.settings.defaultExamPassingScore);
      setDefaultTestCooldownHours(data.settings.defaultTestCooldownHours);
      setDefaultExamCooldownHours(data.settings.defaultExamCooldownHours);
      setUnlimitedQuizRetries(data.settings.unlimitedQuizRetries);
      setSmtpConfigured(data.settings.smtpConfigured);
      setEmailNotificationsEnabled(data.settings.emailNotificationsEnabled);
      setCertificatePrefix(data.settings.certificatePrefix);
      setAutoIssueCertificates(data.settings.autoIssueCertificates);
      setCertificateTemplate(data.settings.certificateTemplate);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaveSuccess(false);

    try {
      await adminAPI.updateSettings({
        platformName,
        supportEmail,
        timezone,
        maintenanceMode,
        defaultQuizPassingScore,
        defaultTestPassingScore,
        defaultExamPassingScore,
        defaultTestCooldownHours,
        defaultExamCooldownHours,
        unlimitedQuizRetries,
        smtpConfigured,
        emailNotificationsEnabled,
        certificatePrefix,
        autoIssueCertificates,
        certificateTemplate,
      });

      setSaveSuccess(true);
      fetchSettings();

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await adminAPI.testEmail();
      alert("Test email sent successfully!");
    } catch (error) {
      alert("Failed to send test email");
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-xl text-[#6B6B6B]">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "Lexend, sans-serif" }}>
              Settings
            </h1>
            <p className="text-[#6B6B6B]">Configure platform settings and preferences</p>
          </div>

          {/* Save Success Message */}
          {saveSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-green-800 font-semibold">Settings saved successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Settings Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Platform Settings */}
                <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                  <div className="flex items-center mb-6">
                    <Globe className="w-5 h-5 text-[#7A9D96] mr-2" />
                    <h2 className="text-xl font-bold text-[#2C2C2C]">Platform Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Platform Name</label>
                      <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Support Email</label>
                      <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Timezone</label>
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-orange-600 mr-3" />
                        <div>
                          <div className="font-semibold text-[#2C2C2C]">Maintenance Mode</div>
                          <div className="text-sm text-[#6B6B6B]">Disable user access temporarily</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A9D96]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Course Settings */}
                <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                  <div className="flex items-center mb-6">
                    <Target className="w-5 h-5 text-[#7A9D96] mr-2" />
                    <h2 className="text-xl font-bold text-[#2C2C2C]">Course Settings</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Quiz Passing Score (%)</label>
                      <input type="number" value={defaultQuizPassingScore} onChange={(e) => setDefaultQuizPassingScore(parseInt(e.target.value))} min="0" max="100" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Test Passing Score (%)</label>
                      <input type="number" value={defaultTestPassingScore} onChange={(e) => setDefaultTestPassingScore(parseInt(e.target.value))} min="0" max="100" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Exam Passing Score (%)</label>
                      <input type="number" value={defaultExamPassingScore} onChange={(e) => setDefaultExamPassingScore(parseInt(e.target.value))} min="0" max="100" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Test Cooldown (hours)</label>
                      <input type="number" value={defaultTestCooldownHours} onChange={(e) => setDefaultTestCooldownHours(parseInt(e.target.value))} min="0" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Exam Cooldown (hours)</label>
                      <input type="number" value={defaultExamCooldownHours} onChange={(e) => setDefaultExamCooldownHours(parseInt(e.target.value))} min="0" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none" required />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                    <div>
                      <div className="font-semibold text-[#2C2C2C]">Unlimited Quiz Retries</div>
                      <div className="text-sm text-[#6B6B6B]">Allow students to retry quizzes unlimited times</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={unlimitedQuizRetries} onChange={(e) => setUnlimitedQuizRetries(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A9D96]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A9D96]"></div>
                    </label>
                  </div>
                </div>

                {/* Email Settings */}
                <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                  <div className="flex items-center mb-6">
                    <Mail className="w-5 h-5 text-[#7A9D96] mr-2" />
                    <h2 className="text-xl font-bold text-[#2C2C2C]">Email Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                      <div>
                        <div className="font-semibold text-[#2C2C2C]">SMTP Configured</div>
                        <div className="text-sm text-[#6B6B6B]">Email server is set up and ready</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={smtpConfigured} onChange={(e) => setSmtpConfigured(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A9D96]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A9D96]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                      <div>
                        <div className="font-semibold text-[#2C2C2C]">Email Notifications</div>
                        <div className="text-sm text-[#6B6B6B]">Send automated emails to users</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={emailNotificationsEnabled} onChange={(e) => setEmailNotificationsEnabled(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A9D96]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A9D96]"></div>
                      </label>
                    </div>

                    <button type="button" onClick={handleTestEmail} className="w-full py-3 border-2 border-[#E8E8E6] text-[#2C2C2C] rounded-lg font-semibold hover:border-[#7A9D96] hover:bg-[#7A9D96]/5 transition-all">
                      Send Test Email
                    </button>
                  </div>
                </div>

                {/* Certificate Settings */}
                <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                  <div className="flex items-center mb-6">
                    <Award className="w-5 h-5 text-[#7A9D96] mr-2" />
                    <h2 className="text-xl font-bold text-[#2C2C2C]">Certificate Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Certificate Prefix</label>
                      <input type="text" value={certificatePrefix} onChange={(e) => setCertificatePrefix(e.target.value)} placeholder="MIC-2024-" className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none font-mono" required />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">Certificate Template</label>
                      <select value={certificateTemplate} onChange={(e) => setCertificateTemplate(e.target.value)} className="w-full px-4 py-3 border-2 border-[#E8E8E6] rounded-lg focus:border-[#7A9D96] focus:ring-2 focus:ring-[#7A9D96]/20 outline-none">
                        <option value="default">Default Template</option>
                        <option value="professional">Professional Template</option>
                        <option value="modern">Modern Template</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E8E8E6]">
                      <div>
                        <div className="font-semibold text-[#2C2C2C]">Auto-Issue Certificates</div>
                        <div className="text-sm text-[#6B6B6B]">Automatically issue certificates when course is completed</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={autoIssueCertificates} onChange={(e) => setAutoIssueCertificates(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A9D96]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A9D96]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
                  <Save className="w-5 h-5" />
                  <span>{saving ? "Saving..." : "Save All Settings"}</span>
                </button>
              </form>
            </div>

            {/* System Information Sidebar */}
            <div className="space-y-6">
              {/* System Stats */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                <div className="flex items-center mb-6">
                  <Database className="w-5 h-5 text-[#7A9D96] mr-2" />
                  <h2 className="text-xl font-bold text-[#2C2C2C]">System Stats</h2>
                </div>
                {systemStats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#6B6B6B]">Total Users</span>
                      <span className="font-bold text-[#2C2C2C]">{systemStats.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#6B6B6B]">Total Courses</span>
                      <span className="font-bold text-[#2C2C2C]">{systemStats.totalCourses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#6B6B6B]">Total Questions</span>
                      <span className="font-bold text-[#2C2C2C]">{systemStats.totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#6B6B6B]">Certificates Issued</span>
                      <span className="font-bold text-[#2C2C2C]">{systemStats.totalCertificates}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* System Information */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#E8E8E6]">
                <div className="flex items-center mb-6">
                  <Server className="w-5 h-5 text-[#7A9D96] mr-2" />
                  <h2 className="text-xl font-bold text-[#2C2C2C]">System Info</h2>
                </div>
                {systemStats && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-[#6B6B6B] mb-1">API Version</div>
                      <div className="font-mono text-sm font-semibold text-[#2C2C2C]">{systemStats.apiVersion}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B6B6B] mb-1">Node.js Version</div>
                      <div className="font-mono text-sm font-semibold text-[#2C2C2C]">{systemStats.nodeVersion}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B6B6B] mb-1">Server Uptime</div>
                      <div className="font-mono text-sm font-semibold text-[#2C2C2C]">{formatUptime(systemStats.uptime)}</div>
                    </div>
                    {settings?.lastBackupDate && (
                      <div>
                        <div className="text-xs text-[#6B6B6B] mb-1">Last Backup</div>
                        <div className="font-mono text-sm font-semibold text-[#2C2C2C]">{new Date(settings.lastBackupDate).toLocaleDateString()}</div>
                      </div>
                    )}
                    {settings?.updatedAt && (
                      <div>
                        <div className="text-xs text-[#6B6B6B] mb-1">Settings Last Updated</div>
                        <div className="font-mono text-sm font-semibold text-[#2C2C2C]">{new Date(settings.updatedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-xl p-6 text-white">
                <div className="flex items-center mb-4">
                  <Zap className="w-5 h-5 mr-2" />
                  <h2 className="text-lg font-bold">Quick Actions</h2>
                </div>
                <div className="space-y-2">
                  <button onClick={fetchSettings} className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdminSettings;
