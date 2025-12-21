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
