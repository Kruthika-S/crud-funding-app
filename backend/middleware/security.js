import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";

export const securityMiddleware = (app) => {
  // Security headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100,
    message: "Too many requests, please try again later"
  });
  app.use(limiter);

  // XSS protection
  app.use(xss());
};
