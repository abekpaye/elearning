const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: {
      type: [optionSchema],
      required: true
    },
    correctOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    tasks: {
      type: [taskSchema],
      default: []
    }
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String
    },
    videoUrl: {
      type: String
    },
    orderNumber: {
      type: Number
    }
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

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
    },

    createdAt: {
      type: Date,
      required: true
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("Course", courseSchema);
