const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

exports.askQuestion = async (req, res) => {
  const { courseId, content } = req.body;

  const enrolled = await Enrollment.findOne({
    studentId: req.user.id,
    courseId
  });

  if (!enrolled) {
    return res.status(403).json({ message: "You are not enrolled in this course" });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  course.questions.push({
    studentId: req.user.id,
    content,
    answers: []
  });

  await course.save();

  res.status(201).json({ message: "Question added" });
};

exports.answerQuestion = async (req, res) => {
  const { courseId, questionId } = req.params;
  const { text } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  if (course.mentorId.toString() !== req.user.id) {
    return res.status(403).json({ message: "You are not mentor of this course" });
  }

  const question = course.questions.id(questionId);
  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  question.answers.push({
    mentorId: req.user.id,
    content: text
  });

  await course.save();
  res.json({ message: "Answer added" });
};

exports.getCourseQuestions = async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate("questions.studentId", "name")
    .populate("questions.answers.mentorId", "name");

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json(course.questions);
};
