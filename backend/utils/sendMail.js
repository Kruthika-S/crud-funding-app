import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendMail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Crowdfunding App" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("Mail sent");
  } catch (err) {
    console.error("Mail error:", err);
  }
};
