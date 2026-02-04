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
 * REGISTER (with email verification link)
 */

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  async (req, res, next) => {
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

      // generate verification token
      const verifyToken = generateVerifyToken();

      await db.execute(
        "INSERT INTO users (email, password, verification_token) VALUES (?, ?, ?)",
        [email, hashedPassword, verifyToken]
      );

      const verifyLink = `http://localhost:5000/api/verify/${verifyToken}`;

      // 🔴 SEND EMAIL HERE
      await sendVerificationMail(email, verifyLink);

      res.status(201).json({
        status: "success",
        message: "User registered. Please verify your email.",
      });
    } catch (err) {
      next(err);
    }
  }
);


/**
 * EMAIL VERIFICATION
 */
router.get("/verify/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const [rows] = await db.execute(
      "SELECT id FROM users WHERE verification_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send("Invalid or expired verification link");
    }

    await db.execute(
  "UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?",
  [token]
);


    res.send("Email verified successfully! You can now login.");
  } catch (err) {
    next(err);
  }
});



/**
 * LOGIN
 */
router.post("/login", async (req, res, next) => {
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

    // block login if not verified
    if (!user.is_verified) {
  return res.status(403).json({
    status: "error",
    message: "Please verify your email before logging in",
  });
}
s

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      status: "success",
      message: "Login successful",
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * EMAIL VERIFICATION
 */
router.get("/verify/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const [rows] = await db.execute(
      "SELECT id FROM users WHERE verification_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification link",
      });
    }

    await db.execute(
      "UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?",
      [token]
    );

    res.json({
      status: "success",
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PROTECTED ROUTE (TEST)
 */
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    status: "success",
    message: "Protected route accessed",
    user: req.user,
  });
});

export default router;
