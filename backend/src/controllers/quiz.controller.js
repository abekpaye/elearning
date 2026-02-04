const QuizAttempt = require("../models/QuizAttempt");

exports.createAttempt = async (req, res) => {
  const { quizId, score } = req.body;

  const attempt = await QuizAttempt.create({
    studentId: req.user.id,
    quizId,
    score
  });

  res.status(201).json(attempt);
};