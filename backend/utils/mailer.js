import nodemailer from "nodemailer";

export const sendVerificationMail = async (to, verifyLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // 🔍 Check connection to Gmail
  await transporter.verify();

  const mailOptions = {
    from: `"CRUD Funding App" <${process.env.MAIL_USER}>`,
    to,
    subject: "Verify your email",
    html: `
      <h2>Welcome!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyLink}">${verifyLink}</a>
      <p>This link will expire soon.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("📧 Email sent:", info.response);
};
