const mongoose = require("mongoose");
const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [optionSchema], required: true },
    correctOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    tasks: { type: [taskSchema], default: [] }
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: String,
    videoUrl: String,
    orderNumber: Number
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    lessons: {
      type: [lessonSchema],
      default: []
    },

    quizzes: {
      type: [quizSchema],
      default: []
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

module.exports = mongoose.model("Course", courseSchema);
