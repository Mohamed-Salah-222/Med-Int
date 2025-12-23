import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "bfb2b6e38cad44",
    pass: "6c123df82fff85",
  },
});

export const sendVerificationEmail = async (email: string, code: string, name: string) => {
  const mailOptions = {
    from: '"Medical Interpreter" <noreply@medicalinterpreter.com>',
    to: email,
    subject: "Verify Your Email",
    html: `
      <h1>Hello ${name}!</h1>
      <p>Thank you for registering. Please use the following code to verify your email:</p>
      <h2>${code}</h2>
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
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Medical Interpreter" <noreply@medicalinterpreter.com>',
    to: email,
    subject: "Reset Your Password",
    html: `
      <h1>Hello ${name}!</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Or use this token: <strong>${resetToken}</strong></p>
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
        <h1 style="color: #2c3e50;">Congratulations, ${name}! 🎉</h1>
        
        <p style="font-size: 16px; line-height: 1.6;">
          We are thrilled to inform you that you have successfully completed the 
          <strong>Medical Interpreter Certification Course</strong> and passed your final exam 
          with a score of <strong>${mainCertificate.finalExamScore}%</strong>!
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          You have been issued <strong>TWO certificates</strong>:
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #27ae60; margin-top: 0;">📜 Medical Interpreter Certificate</h2>
          <p><strong>Certificate Number:</strong> ${mainCertificate.certificateNumber}</p>
          <p><strong>Verification Code:</strong> ${mainCertificate.verificationCode}</p>
          <p><strong>Course:</strong> ${mainCertificate.courseTitle}</p>
          <p><strong>Completion Date:</strong> ${new Date(mainCertificate.completionDate).toLocaleDateString()}</p>
          <p><strong>Score:</strong> ${mainCertificate.finalExamScore}%</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #27ae60; margin-top: 0;">📜 HIPAA Certificate</h2>
          <p><strong>Certificate Number:</strong> ${hipaaCertificate.certificateNumber}</p>
          <p><strong>Verification Code:</strong> ${hipaaCertificate.verificationCode}</p>
          <p><strong>Course:</strong> ${hipaaCertificate.courseTitle}</p>
          <p><strong>Completion Date:</strong> ${new Date(hipaaCertificate.completionDate).toLocaleDateString()}</p>
          <p><strong>Score:</strong> ${hipaaCertificate.finalExamScore}%</p>
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
