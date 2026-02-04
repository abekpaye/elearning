const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const mongoose = require("mongoose");

exports.createAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    // answers: [{ taskId: "...", selectedOptionId: "..." }, ...]

    const studentId = req.user.id;

    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "quizId and answers array are required"
      });
    }

    // 1) Find course that contains this quiz (we need correctOptionId for checking)
    const course = await Course.findOne(
      { "quizzes._id": quizId },
      { quizzes: 1 }
    );

    if (!course) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // 2) Get the quiz subdocument
    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // 3) Check enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: course._id
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    // 4) Build map: taskId -> selectedOptionId
    const answerMap = new Map(
      answers.map((a) => [String(a.taskId), String(a.selectedOptionId)])
    );

    // 5) Check each question and create results
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

    // 6) Score: 20 points per correct answer
    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = correctCount * 20;

    // 7) Save attempt to quizAttempts
    await QuizAttempt.create({
      studentId,
      quizId,
      score
    });

    // 8) Update progress: average score across all quizzes in this course
    const quizIds = course.quizzes.map((q) => q._id);

    const agg = await QuizAttempt.aggregate([
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

    const progress = agg.length ? Math.round(agg[0].avgScore) : 0;

    enrollment.progress = progress;
    await enrollment.save();

    // 9) Return data so frontend can show correct/wrong after submit
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

