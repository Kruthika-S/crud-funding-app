import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import { securityMiddleware } from "./middleware/security.js";
import demoRoutes from "./routes/demo.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import campaignRoutes from "./routes/campaign.routes.js";
import donationRoutes from "./routes/donation.routes.js";



console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS exists:", !!process.env.MAIL_PASS);

const app = express();

/**
 * 1️⃣ Body parsers
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 2️⃣ Request logging
 */
app.use(requestLogger);

/**
 * 3️⃣ Security middleware
 */
securityMiddleware(app);

/**
 * 4️⃣ Routes
 */
app.use("/api", demoRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);



/**
 * 5️⃣ Health check
 */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Secure backend running inside Docker 🔐",
  });
});

/**
 * 6️⃣ Global error handler
 */
app.use(errorHandler);

export default app;
