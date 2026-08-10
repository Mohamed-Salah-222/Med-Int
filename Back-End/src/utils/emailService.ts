import nodemailer from "nodemailer";

//* Every value interpolated into the HTML templates below goes through this.
//* Names come straight from registration, so an unescaped `${name}` lets an
//* attacker inject markup into mail we send on their behalf.
//* `&` must be replaced first, otherwise the entities emitted by the later
//* replacements would themselves be re-escaped.
//* Quotes are escaped too because some values land inside quoted attributes
//* (the reset link's href), where `<`/`>` escaping alone would not be enough.
const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

//* Credentials come from the environment. This module is imported after
//* dotenv.config() runs in server.ts, so process.env is already populated.
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT) || 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, code: string, name: string) => {
  const mailOptions = {
    from: '"Medical Interpreter" <noreply@medicalinterpreter.com>',
    to: email,
    subject: "Verify Your Email",
    html: `
      <h1>Hello ${escapeHtml(name)}!</h1>
      <p>Thank you for registering. Please use the following code to verify your email:</p>
      <h2>${escapeHtml(code)}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string, name: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Medical Interpreter" <noreply@medicalinterpreter.com>',
    to: email,
    subject: "Reset Your Password",
    html: `
      <h1>Hello ${escapeHtml(name)}!</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a>
      <p>Or use this token: <strong>${escapeHtml(resetToken)}</strong></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

//* Sent when someone tries to register or request a verification code for an
//* address that already belongs to a verified account. The HTTP response for
//* that case is deliberately indistinguishable from a successful signup, so
//* this email is the only place the real owner learns what happened.
export const sendAccountExistsEmail = async (email: string, name: string) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  const forgotPasswordUrl = `${process.env.FRONTEND_URL}/forgot-password`;

  const mailOptions = {
    from: '"Medical Interpreter" <noreply@medicalinterpreter.com>',
    to: email,
    subject: "You already have an account",
    html: `
      <h1>Hello ${escapeHtml(name)}!</h1>
      <p>Someone just tried to sign up using this email address, but you already have a verified account with us.</p>
      <p>If this was you, there's nothing to do — just <a href="${escapeHtml(loginUrl)}">sign in</a> as usual.</p>
      <p>If you've forgotten your password, you can <a href="${escapeHtml(forgotPasswordUrl)}">reset it here</a>.</p>
      <p>If this wasn't you, you can safely ignore this email. Your account has not been changed and no one has gained access to it.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Account-exists notice sent to ${email}`);
  } catch (error) {
    console.error("Error sending account-exists email:", error);
    throw new Error("Failed to send account notice email");
  }
};

export const sendCertificateEmail = async (
  email: string,
  name: string,
  mainCertificate: {
    certificateNumber: string;
    verificationCode: string;
    courseTitle: string;
    completionDate: Date;
    finalExamScore: number;
  },
  hipaaCertificate: {
    certificateNumber: string;
    verificationCode: string;
    courseTitle: string;
    completionDate: Date;
    finalExamScore: number;
  }
) => {
  const mailOptions = {
    from: '"Medical Interpreter Academy" <certificates@medicalinterpreter.com>',
    to: email,
    subject: "🎉 Congratulations! Your Certificates Have Been Issued",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">Congratulations, ${escapeHtml(name)}! 🎉</h1>

        <p style="font-size: 16px; line-height: 1.6;">
          We are thrilled to inform you that you have successfully completed the
          <strong>Medical Interpreter Certification Course</strong> and passed your final exam
          with a score of <strong>${escapeHtml(mainCertificate.finalExamScore)}%</strong>!
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          You have been issued <strong>TWO certificates</strong>:
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #27ae60; margin-top: 0;">📜 Medical Interpreter Certificate</h2>
          <p><strong>Certificate Number:</strong> ${escapeHtml(mainCertificate.certificateNumber)}</p>
          <p><strong>Verification Code:</strong> ${escapeHtml(mainCertificate.verificationCode)}</p>
          <p><strong>Course:</strong> ${escapeHtml(mainCertificate.courseTitle)}</p>
          <p><strong>Completion Date:</strong> ${escapeHtml(new Date(mainCertificate.completionDate).toLocaleDateString())}</p>
          <p><strong>Score:</strong> ${escapeHtml(mainCertificate.finalExamScore)}%</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #27ae60; margin-top: 0;">📜 HIPAA Certificate</h2>
          <p><strong>Certificate Number:</strong> ${escapeHtml(hipaaCertificate.certificateNumber)}</p>
          <p><strong>Verification Code:</strong> ${escapeHtml(hipaaCertificate.verificationCode)}</p>
          <p><strong>Course:</strong> ${escapeHtml(hipaaCertificate.courseTitle)}</p>
          <p><strong>Completion Date:</strong> ${escapeHtml(new Date(hipaaCertificate.completionDate).toLocaleDateString())}</p>
          <p><strong>Score:</strong> ${escapeHtml(hipaaCertificate.finalExamScore)}%</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          These certificates demonstrate your commitment to professional medical interpreting and 
          your understanding of HIPAA compliance in healthcare settings.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          You can download your certificates from your account dashboard at any time. 
          Keep your certificate numbers and verification codes safe for future reference.
        </p>

        <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            <strong>Note:</strong> Employers or clients can verify your certificates using the 
            certificate number and verification code on our verification portal.
          </p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          Congratulations once again on this significant achievement! We wish you success in your 
          career as a certified medical interpreter.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Best regards,<br>
          <strong>The Medical Interpreter Academy Team</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Certificate email sent to ${email}`);
  } catch (error) {
    console.error("Error sending certificate email:", error);
    throw new Error("Failed to send certificate email");
  }
};
