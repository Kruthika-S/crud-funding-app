import express from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import { validate } from "../middleware/validate.js";
import { generateToken } from "../utils/token.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { generateVerifyToken } from "../utils/verifyToken.js";
import { sendVerificationMail } from "../utils/mailer.js";

const router = express.Router();

/**
 * ============================
 * REGISTER (Email Verification)
 * ============================
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verifyToken = generateVerifyToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.execute(
      `INSERT INTO users 
      (email, password, verification_token, verification_expires) 
      VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, verifyToken, expires]
    );

    const verifyLink = `${process.env.BASE_URL}/api/verify/${verifyToken}`;

    await sendVerificationMail(email, verifyLink);

    res.status(201).json({
      status: "success",
      message: "Verification email sent. Check inbox.",
    });

  } catch (err) {
    next(err);
  }
});

/**
 * ====================
 * EMAIL VERIFICATION
 * ====================
 */
router.get("/verify/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE verification_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send("Invalid link");
    }

    const user = rows[0];

    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      return res.status(400).send("Link expired");
    }

    await db.execute(
      `UPDATE users
       SET is_verified = 1,
           verification_token = NULL,
           verification_expires = NULL
       WHERE id = ?`,
      [user.id]
    );

    res.send("Email verified successfully!");

  } catch (err) {
    next(err);
  }
});

/**
 * =========
 * RRESEND VERIFICATION
 * =========
 */

router.post("/resend-verification", async (req, res, next) => {
  try {
    const { email } = req.body;

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.json({
        status: "success",
        message: "Already verified",
      });
    }

    const verifyToken = generateVerifyToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.execute(
      `UPDATE users
       SET verification_token = ?, verification_expires = ?
       WHERE email = ?`,
      [verifyToken, expires, email]
    );

    const verifyLink = `${process.env.BASE_URL}/api/verify/${verifyToken}`;

    await sendVerificationMail(email, verifyLink);

    res.json({
      status: "success",
      message: "Verification email resent",
    });

  } catch (err) {
    next(err);
  }
});


/**
 * =========
 * LOGIN
 * =========
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const [rows] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      const user = rows[0];

      if (user.is_verified === 0) {
        return res.status(403).json({
          status: "error",
          message: "Please verify your email first",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
      });

      res.json({
        status: "success",
        message: "Login successful",
        token,
      });

    } catch (err) {
      next(err);
    }
  }
);

/**
 * =================
 * FORGET PASSWORD ROUTE
 * =================
 */

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const resetToken = generateVerifyToken();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.execute(
      `UPDATE users 
       SET reset_token = ?, reset_expires = ?
       WHERE email = ?`,
      [resetToken, expires, email]
    );

    const resetLink = `http://192.168.1.3:5000/api/reset-password/${resetToken}`;

    await sendVerificationMail(email, resetLink);

    res.json({
      status: "success",
      message: "Password reset email sent",
    });

  } catch (err) {
    next(err);
  }
});

/**
 * =================
 * VERIFY RESET ROUTE
 * =================
 */

router.get("/reset-password/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE reset_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.send("Invalid reset link");
    }

    const user = rows[0];

    if (new Date(user.reset_expires) < new Date()) {
      return res.send("Reset link expired");
    }

    res.send("Token valid. Send POST request with new password.");

  } catch (err) {
    next(err);
  }
});


/**
 * =================
 * UPDATE PASSWORD ROUTE
 * =================
 */

router.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE reset_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid token",
      });
    }

    const user = rows[0];

    if (new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Token expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_expires = NULL
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({
      status: "success",
      message: "Password updated successfully",
    });

  } catch (err) {
    next(err);
  }
});


/**
 * =================
 * PROTECTED ROUTE
 * =================
 */
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    status: "success",
    message: "Protected route accessed",
    user: req.user,
  });
});

export default router;
