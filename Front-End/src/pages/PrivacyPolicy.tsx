import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Lock, Eye, UserCheck, FileText, Database, Mail } from "lucide-react";

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div onClick={() => navigate("/")} className="flex items-center space-x-3 cursor-pointer group">
            <Shield className="w-8 h-8 text-[#7A9D96] group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
              Medical Interpreter Academy
            </span>
          </div>

          <button onClick={() => navigate("/")} className="flex items-center space-x-2 text-[#2C2C2C] hover:text-[#7A9D96] font-semibold transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 px-6 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#7A9D96]/10 to-[#6A8D86]/10 text-[#7A9D96] px-4 py-2 rounded-full mb-6 border border-[#7A9D96]/20">
            <Lock className="w-5 h-5" />
            <span className="font-bold text-sm">Your Privacy Matters</span>
          </div>
          <h1 className="text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
            Privacy Policy
          </h1>
          <p className="text-lg text-[#6B6B6B] mb-4">Last Updated: January 16, 2026</p>
          <p className="text-[#6B6B6B] leading-relaxed">We are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-12">
            {/* Introduction */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  1. Introduction
                </h2>
              </div>
              <p className="text-[#6B6B6B] leading-relaxed">Medical Interpreter Academy ("we," "our," or "us") operates the Medical Interpreter Academy platform. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our educational services. By accessing or using our platform, you agree to this Privacy Policy.</p>
            </div>

            {/* Information We Collect */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Database className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  2. Information We Collect
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-3">2.1 Personal Information You Provide</h3>
                  <p className="text-[#6B6B6B] leading-relaxed mb-3">When you register for an account or use our services, we collect:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="text-[#6B6B6B] leading-relaxed">• Name and contact information (email address)</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Account credentials (username and encrypted password)</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Payment information (processed securely through third-party payment processors)</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Profile information you choose to provide</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-3">2.2 Usage Information</h3>
                  <p className="text-[#6B6B6B] leading-relaxed mb-3">We automatically collect information about how you interact with our platform:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="text-[#6B6B6B] leading-relaxed">• Course progress and completion data</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Quiz and test results</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Time spent on lessons and activities</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Device information (browser type, operating system, IP address)</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Log data and analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-3">2.3 Cookies and Tracking Technologies</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">We use cookies and similar technologies to enhance your experience, analyze usage patterns, and maintain your session. You can control cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.</p>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <UserCheck className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  3. How We Use Your Information
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-3">We use your personal information for the following purposes:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-[#6B6B6B] leading-relaxed">• To provide and maintain our educational services</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To process your enrollment and payments</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To track your course progress and issue certificates</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To communicate with you about your account and courses</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To improve our platform and develop new features</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To send educational updates and promotional materials (with your consent)</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To prevent fraud and ensure platform security</li>
                <li className="text-[#6B6B6B] leading-relaxed">• To comply with legal obligations</li>
              </ul>
            </div>

            {/* Information Sharing */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Eye className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  4. How We Share Your Information
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>

              <div className="space-y-4">
                <div className="bg-[#FAFAF8] p-4 rounded-lg border border-[#E8E8E6]">
                  <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Service Providers</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">We work with third-party service providers who assist us in operating our platform, processing payments, hosting services, and analytics. These providers have access only to the information necessary to perform their functions and are obligated to protect your data.</p>
                </div>

                <div className="bg-[#FAFAF8] p-4 rounded-lg border border-[#E8E8E6]">
                  <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Legal Requirements</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">We may disclose your information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</p>
                </div>

                <div className="bg-[#FAFAF8] p-4 rounded-lg border border-[#E8E8E6]">
                  <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">Business Transfers</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change.</p>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  5. Data Security
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-3">We implement industry-standard security measures to protect your personal information, including:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-[#6B6B6B] leading-relaxed">• Encryption of data in transit using SSL/TLS protocols</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Secure password hashing and storage</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Regular security audits and updates</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Access controls and authentication mechanisms</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Secure server infrastructure</li>
              </ul>
              <p className="text-[#6B6B6B] leading-relaxed mt-3">However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
            </div>

            {/* Your Rights */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  6. Your Privacy Rights
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-3">Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-[#6B6B6B] leading-relaxed">
                  • <strong>Access:</strong> Request a copy of the personal information we hold about you
                </li>
                <li className="text-[#6B6B6B] leading-relaxed">
                  • <strong>Correction:</strong> Request correction of inaccurate or incomplete information
                </li>
                <li className="text-[#6B6B6B] leading-relaxed">
                  • <strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)
                </li>
                <li className="text-[#6B6B6B] leading-relaxed">
                  • <strong>Portability:</strong> Request transfer of your data to another service
                </li>
                <li className="text-[#6B6B6B] leading-relaxed">
                  • <strong>Opt-out:</strong> Unsubscribe from marketing communications
                </li>
                <li className="text-[#6B6B6B] leading-relaxed">
                  • <strong>Object:</strong> Object to processing of your personal information in certain circumstances
                </li>
              </ul>
              <p className="text-[#6B6B6B] leading-relaxed mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:support@medicalinterpreteracademy.com" className="text-[#7A9D96] hover:underline">
                  support@medicalinterpreteracademy.com
                </a>
                . We will respond to your request within 30 days.
              </p>
            </div>

            {/* Data Retention */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Database className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  7. Data Retention
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. After you close your account, we may retain certain information for legitimate business purposes, such as fraud prevention, dispute resolution, and legal compliance. Certificate records are maintained indefinitely for verification purposes.
              </p>
            </div>

            {/* Children's Privacy */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <UserCheck className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  8. Children's Privacy
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed">Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately, and we will take steps to delete such information.</p>
            </div>

            {/* International Data Transfers */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Eye className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  9. International Data Transfers
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your information internationally, we ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </div>

            {/* Policy Updates */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  10. Changes to This Privacy Policy
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed">We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by posting the updated policy on our platform and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.</p>
            </div>

            {/* Contact */}
            <div className="border-t border-[#E8E8E6] pt-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  11. Contact Us
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-4">If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              <div className="bg-gradient-to-br from-[#7A9D96]/5 to-[#6A8D86]/5 p-6 rounded-xl border-2 border-[#7A9D96]/20">
                <p className="text-[#2C2C2C] font-semibold mb-2">Medical Interpreter Academy</p>
                <p className="text-[#6B6B6B]">
                  Email:{" "}
                  <a href="mailto:support@medicalinterpreteracademy.com" className="text-[#7A9D96] hover:underline">
                    support@medicalinterpreteracademy.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-gray-400 border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 Medical Interpreter Academy. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy-policy" className="text-sm hover:text-[#7A9D96] transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="text-sm hover:text-[#7A9D96] transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
