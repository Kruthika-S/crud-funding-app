import crypto from "crypto";

export const generateVerifyToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
