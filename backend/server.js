import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Backend running inside Docker 🚀"
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
