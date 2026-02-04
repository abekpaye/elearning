const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const enrollmentRoutes = require("./routes/enrollment.routes");
const quizRoutes = require("./routes/quiz.routes");
const userRoutes = require("./routes/user.routes");
const questionRoutes = require("./routes/question.routes");
const analyticsRoutes = require("./routes/analytics.routes");

const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve static frontend
const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

// Fallback: always return index.html for SPA routing (Express 5.x compatible)
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

module.exports = app;
