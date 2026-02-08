const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const mongoose = require("mongoose");

exports.createAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;

    const studentId = req.user.id;

    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "quizId and answers array are required"
      });
    }

    const course = await Course.findOne(
      { "quizzes._id": quizId },
      { quizzes: 1 }
    );

    if (!course) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: course._id
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    const answerMap = new Map(
      answers.map((a) => [String(a.taskId), String(a.selectedOptionId)])
    );

    const results = quiz.tasks.map((t) => {
      const taskId = String(t._id);
      const selectedOptionId = answerMap.get(taskId) || null;
      const correctOptionId = String(t.correctOptionId);

      const isCorrect =
        selectedOptionId && selectedOptionId === correctOptionId;

      return {
        taskId,
        selectedOptionId,
        correctOptionId,
        isCorrect
      };
    });

    const totalQuestions = quiz.tasks.length;

    const correctCount = results.filter((r) => r.isCorrect).length;

    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    await QuizAttempt.create({
      studentId,
      quizId,
      score
    });


    const quizIds = course.quizzes.map(q => q._id);

    const attempts = await QuizAttempt.find({
      studentId,
      quizId: { $in: quizIds }
    });

    const bestScoresMap = {};

    for (const attempt of attempts) {
      const qid = attempt.quizId.toString();

      if (
        bestScoresMap[qid] === undefined ||
        attempt.score > bestScoresMap[qid]
      ) {
        bestScoresMap[qid] = attempt.score;
      }
    }

    const totalQuizzes = quizIds.length;

    const totalBestScore = Object.values(bestScoresMap)
      .reduce((sum, s) => sum + s, 0);

    const progress =
      totalQuizzes > 0
        ? Math.round(totalBestScore / totalQuizzes)
        : 0;

    enrollment.progress = progress;
    await enrollment.save();

    return res.status(201).json({
      message: "Attempt saved, progress updated",
      score,
      progress,
      results
    });
    
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

