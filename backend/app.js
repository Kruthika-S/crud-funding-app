import express from "express";

const app = express();

/**
 * Global middlewares
 */
app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true })); // parse form data

/**
 * Health check route
 */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend running inside Docker 🚀"
  });
});

export default app;
