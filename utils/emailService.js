import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordEmail = async (email, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your New Password",
    text: `Your new password is: ${password}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password email sent to", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
const FRONTEND_URL = process.env.FRONTEND_URL;
export const sendResetEmail = async (email, token) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
    text: `Click this link to reset your password: ${resetLink}. This link expires in 1 hour.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Reset email sent to", email);
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw error;
  }
};
