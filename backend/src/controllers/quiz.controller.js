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

exports.deleteLowScores = async (req, res) => {
  await QuizAttempt.deleteMany({ score: { $lt: 50 } });
  res.json({ message: "Low score attempts deleted" });
};