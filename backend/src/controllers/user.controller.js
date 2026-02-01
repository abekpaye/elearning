const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const QuizAttempt = require("../models/QuizAttempt");

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  await User.findByIdAndDelete(id);
  await Enrollment.deleteMany({ studentId: id });
  await QuizAttempt.deleteMany({ studentId: id });

  res.json({ message: "User and related data deleted" });
};
