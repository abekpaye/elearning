const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  askQuestion,
  answerQuestion,
  getCourseQuestions
} = require("../controllers/question.controller");

router.post("/", auth, role("student"), askQuestion);

router.post(
  "/course/:courseId/question/:questionId/answer",
  auth,
  role("mentor"),
  answerQuestion
);

router.get("/course/:courseId", auth, getCourseQuestions);

module.exports = router;
