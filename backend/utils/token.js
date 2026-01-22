import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecretkey"; // later we’ll move this to env

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
