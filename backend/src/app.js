const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const enrollmentRoutes = require("./routes/enrollment.routes");
const quizRoutes = require("./routes/quiz.routes");
const analyticsRoutes = require("./routes/analytics.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/analytics", analyticsRoutes);

const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(frontendPath, "register.html"));
});

app.get("/progress", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

app.get("/courses", (req, res) => {
  res.sendFile(path.join(frontendPath, "courses.html"));
});

app.get("/create-course", (req, res) => {
  res.sendFile(path.join(frontendPath, "create-course.html"));
});

app.get("/course", (req, res) => {
  res.sendFile(path.join(frontendPath, "course.html"));
});

module.exports = app;