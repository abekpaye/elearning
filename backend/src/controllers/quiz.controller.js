const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const mongoose = require("mongoose");

exports.createAttempt = async (req, res) => {
  try {
    const { quizId, score } = req.body;
    const studentId = req.user.id;

    const course = await Course.findOne(
      { "quizzes._id": quizId },
      { quizzes: 1 }
    );

    if (!course) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: course._id
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    await QuizAttempt.create({
      studentId,
      quizId,
      score
    });

    const quizIds = course.quizzes.map(q => q._id);

    const result = await QuizAttempt.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          quizId: { $in: quizIds }
        }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" }
        }
      }
    ]);

    const progress = result.length
      ? Math.round(result[0].avgScore)
      : 0;

    enrollment.progress = progress;
    await enrollment.save();

    res.status(201).json({
      message: "Attempt saved, progress updated",
      progress
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
