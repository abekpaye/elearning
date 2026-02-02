const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    score: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
   
);

quizAttemptSchema.index({ quizId: 1, score: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema, "quizAttempts");
