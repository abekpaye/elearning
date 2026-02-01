const Enrollment = require("../models/Enrollment");

exports.enrollToCourse = async (req, res) => {
  const { courseId } = req.body;

  try {
    const enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId
    });

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: "Already enrolled or invalid data" });
  }
};

exports.updateProgress = async (req, res) => {
  const { courseId, value } = req.body;

  const enrollment = await Enrollment.findOneAndUpdate(
    { studentId: req.user.id, courseId },
    { $inc: { progress: value } },
    { new: true }
  );

  res.json(enrollment);
};
