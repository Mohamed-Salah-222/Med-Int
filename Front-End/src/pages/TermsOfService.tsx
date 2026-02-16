import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, FileText, Award, AlertCircle, Scale, CheckCircle, XCircle } from "lucide-react";

function TermsOfService() {
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
            <Scale className="w-5 h-5" />
            <span className="font-bold text-sm">Legal Agreement</span>
          </div>
          <h1 className="text-5xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "Lexend, sans-serif" }}>
            Terms of Service
          </h1>
          <p className="text-lg text-[#6B6B6B] mb-4">Last Updated: January 16, 2026</p>
          <p className="text-[#6B6B6B] leading-relaxed">Please read these Terms of Service carefully before using our platform. By accessing or using our services, you agree to be bound by these terms.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-12">
            {/* Acceptance */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  1. Acceptance of Terms
                </h2>
              </div>
              <p className="text-[#6B6B6B] leading-relaxed mb-3">These Terms of Service ("Terms") constitute a legally binding agreement between you and Medical Interpreter Academy ("we," "our," or "us") regarding your access to and use of our online educational platform and services.</p>
              <p className="text-[#6B6B6B] leading-relaxed">By creating an account, enrolling in a course, or otherwise accessing our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree with these Terms, you must not use our services.</p>
            </div>

            {/* Eligibility */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  2. Eligibility
                </h2>
              </div>
              <p className="text-[#6B6B6B] leading-relaxed mb-3">To use our services, you must:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-[#6B6B6B] leading-relaxed">• Be at least 18 years of age</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Have the legal capacity to enter into a binding contract</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Provide accurate and complete registration information</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Not be prohibited from using our services under applicable laws</li>
              </ul>
              <p className="text-[#6B6B6B] leading-relaxed mt-3">You represent and warrant that all information you provide is accurate and that you will maintain the accuracy of such information throughout your use of our services.</p>
            </div>

            {/* Account Registration */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  3. Account Registration and Security
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">3.1 Account Creation</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">When you create an account, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">3.2 Account Security</h3>
                  <p className="text-[#6B6B6B] leading-relaxed mb-2">You agree to:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="text-[#6B6B6B] leading-relaxed">• Immediately notify us of any unauthorized access to your account</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Not share your login credentials with anyone</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Use a strong, unique password</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Log out from your account at the end of each session</li>
                  </ul>
                  <p className="text-[#6B6B6B] leading-relaxed mt-2">We are not liable for any loss or damage arising from your failure to protect your account information.</p>
                </div>
              </div>
            </div>

            {/* Course Enrollment and License */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  4. Course Enrollment and License Grant
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">4.1 License Grant</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">Upon enrollment and payment, we grant you a limited, non-exclusive, non-transferable, non-sublicensable license to access and use the course materials for your personal, non-commercial educational purposes only. This license does not transfer any ownership rights to you.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">4.2 Course Access</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">Once enrolled, you will have lifetime access to the course materials unless your account is terminated for violation of these Terms. Course content may be updated or modified at our discretion to reflect current industry standards and best practices.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">4.3 Certificate Issuance</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">Certificates are issued only upon successful completion of all course requirements, including passing all quizzes, chapter tests, and the final examination with the required minimum scores. Certificate issuance is subject to verification of course completion and compliance with our academic integrity policies.</p>
                </div>
              </div>
            </div>

            {/* Restrictions on Use */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  5. Prohibited Uses and Restrictions
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-3">You agree NOT to:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-[#6B6B6B] leading-relaxed">• Share your account credentials or allow others to access your account</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Copy, reproduce, distribute, publicly display, or create derivative works from course materials</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Record, screenshot, or capture course videos, lessons, or materials in any format</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Sell, rent, lease, or sublicense course materials or access to the platform</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Use course materials to teach others or for commercial purposes without written authorization</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Upload course content to any file-sharing platform, AI training system, or third-party website</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Remove, alter, or obscure any copyright, trademark, or proprietary notices</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Reverse engineer, decompile, or attempt to extract source code from our platform</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Use automated systems (bots, scrapers) to access or interact with our platform</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Engage in any activity that interferes with or disrupts our services</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Cheat, use unauthorized assistance, or violate academic integrity policies</li>
              </ul>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-semibold mb-1">Violation Consequences</p>
                    <p className="text-red-700 text-sm">Violation of these restrictions may result in immediate account termination, revocation of certificates, legal action, and you may be held liable for damages.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  6. Intellectual Property Rights
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-3">All content on our platform, including but not limited to course materials, text, graphics, logos, videos, audio, software, and design elements, is the exclusive property of Medical Interpreter Academy or its licensors and is protected by U.S. and international copyright, trademark, and other intellectual property laws.</p>
              <p className="text-[#6B6B6B] leading-relaxed">No content from our platform may be used without our express written permission, except as expressly permitted under these Terms for your personal educational use.</p>
            </div>

            {/* Payment and Refunds */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  7. Payment Terms and Refund Policy
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">7.1 Payment</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">Course fees are due at the time of enrollment. All prices are in U.S. dollars unless otherwise specified. You agree to pay all applicable fees and taxes. Payment is processed through secure third-party payment processors.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">7.2 Refund Policy</h3>
                  <p className="text-[#6B6B6B] leading-relaxed mb-3">We offer a 14-day money-back guarantee from the date of enrollment, subject to the following conditions:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="text-[#6B6B6B] leading-relaxed">• You must request a refund within 14 days of enrollment</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• You must not have completed more than 20% of the course content</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Refund requests must be submitted via email to support@medicalinterpreteracademy.com</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Refunds are processed within 5-10 business days</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Once a certificate is issued, no refund is available</li>
                  </ul>
                  <p className="text-[#6B6B6B] leading-relaxed mt-3">After the 14-day period or if you have accessed more than 20% of the course, all sales are final. We reserve the right to decline refund requests that do not meet these criteria or that we determine in our sole discretion to be fraudulent or abusive.</p>
                </div>
              </div>
            </div>

            {/* Disclaimers */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  8. Disclaimers and Educational Purpose
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <p className="text-yellow-800 font-semibold mb-2">Important Educational Disclaimer</p>
                  <p className="text-yellow-700 text-sm leading-relaxed">
                    Our courses provide educational training in medical interpretation. We do not guarantee employment, specific income levels, or career outcomes. Individual results vary based on numerous factors including your skills, dedication, local market conditions, and effort. This course does not constitute professional medical, legal, or healthcare advice.
                  </p>
                </div>

                <div>
                  <p className="text-[#6B6B6B] leading-relaxed mb-3">
                    <strong>Platform "As Is":</strong> Our platform and courses are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="text-[#6B6B6B] leading-relaxed">• The platform will be uninterrupted, error-free, or secure</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Course materials are completely accurate or current</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• Defects will be corrected</li>
                    <li className="text-[#6B6B6B] leading-relaxed">• The platform is free of viruses or harmful components</li>
                  </ul>
                </div>

                <div>
                  <p className="text-[#6B6B6B] leading-relaxed">
                    <strong>Technology Requirements:</strong> You are responsible for ensuring you have the necessary internet connection, devices, and software to access our platform. We are not responsible if you cannot access courses due to your technology limitations.
                  </p>
                </div>

                <div>
                  <p className="text-[#6B6B6B] leading-relaxed">
                    <strong>Third-Party Links:</strong> Our platform may contain links to third-party websites or resources. We are not responsible for the availability, accuracy, or content of these external sites. Links do not imply endorsement.
                  </p>
                </div>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Scale className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  9. Limitation of Liability
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-3">To the maximum extent permitted by law, Medical Interpreter Academy and its officers, directors, employees, and agents shall not be liable for:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-[#6B6B6B] leading-relaxed">• Any indirect, incidental, special, consequential, or punitive damages</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Loss of profits, revenue, data, or business opportunities</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Service interruptions or data loss</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Errors or omissions in course content</li>
                <li className="text-[#6B6B6B] leading-relaxed">• Any damages arising from your use or inability to use our services</li>
              </ul>
              <p className="text-[#6B6B6B] leading-relaxed mt-3">Our total liability to you for all claims arising from or related to these Terms or your use of our services shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.</p>
            </div>

            {/* Indemnification */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  10. Indemnification
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed">
                You agree to indemnify, defend, and hold harmless Medical Interpreter Academy and its affiliates, officers, directors, employees, agents, and licensors from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from: (a) your violation of these Terms, (b) your violation of any third-party rights, including intellectual property
                rights, (c) your misuse of course materials, or (d) any content you submit or transmit through our platform.
              </p>
            </div>

            {/* Termination */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  11. Termination
                </h2>
              </div>

              <div className="space-y-3">
                <p className="text-[#6B6B6B] leading-relaxed">We reserve the right to suspend or terminate your account and access to our services at any time, with or without cause, and with or without notice, for any reason including violation of these Terms, fraudulent activity, abusive behavior, or extended periods of inactivity.</p>
                <p className="text-[#6B6B6B] leading-relaxed">Upon termination, your right to access and use our platform immediately ceases. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability.</p>
                <p className="text-[#6B6B6B] leading-relaxed">You may request account deletion at any time by contacting support@medicalinterpreteracademy.com. We will retain certain information as required by law or for legitimate business purposes.</p>
              </div>
            </div>

            {/* Governing Law */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <Scale className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  12. Governing Law and Dispute Resolution
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-[#6B6B6B] leading-relaxed">These Terms shall be governed by and construed in accordance with the laws of the United States and the state in which Medical Interpreter Academy is registered, without regard to its conflict of law provisions.</p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Informal Resolution:</strong> Before filing a claim, you agree to contact us at support@medicalinterpreteracademy.com to attempt to resolve the dispute informally. We will attempt to resolve disputes in good faith within 30 days.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Binding Arbitration:</strong> If we cannot resolve a dispute informally, any claims shall be resolved by binding arbitration, rather than in court, except that you may assert claims in small claims court if they qualify. The Federal Arbitration Act governs the interpretation and enforcement of this provision. Arbitration will be conducted by a single arbitrator under the
                  rules of the American Arbitration Association.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Class Action Waiver:</strong> You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  13. Changes to These Terms
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our platform and updating the "Last Updated" date. Your continued use of our services after such changes constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using our services.
              </p>
            </div>

            {/* Miscellaneous */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  14. General Provisions
                </h2>
              </div>

              <div className="space-y-3">
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Medical Interpreter Academy regarding your use of our services.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Assignment:</strong> You may not assign or transfer these Terms or your rights under them without our prior written consent. We may assign our rights and obligations without restriction.
                </p>
                <p className="text-[#6B6B6B] leading-relaxed">
                  <strong>Force Majeure:</strong> We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="border-t border-[#E8E8E6] pt-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-[#7A9D96]/10 to-[#6A8D86]/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-[#7A9D96]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C2C2C]" style={{ fontFamily: "Lexend, sans-serif" }}>
                  15. Contact Information
                </h2>
              </div>

              <p className="text-[#6B6B6B] leading-relaxed mb-4">If you have any questions about these Terms of Service, please contact us:</p>
              <div className="bg-gradient-to-br from-[#7A9D96]/5 to-[#6A8D86]/5 p-6 rounded-xl border-2 border-[#7A9D96]/20">
                <p className="text-[#2C2C2C] font-semibold mb-2">Medical Interpreter Academy</p>
                <p className="text-[#6B6B6B]">
                  Email:{" "}
                  <a href="mailto:support@medicalinterpreteracademy.com" className="text-[#7A9D96] hover:underline">
                    support@medicalinterpreteracademy.com
                  </a>
                </p>
              </div>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-blue-800 text-sm leading-relaxed">
                  <strong>Acknowledgment:</strong> By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
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

export default TermsOfService;
