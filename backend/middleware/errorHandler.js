import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error"
  });
};
