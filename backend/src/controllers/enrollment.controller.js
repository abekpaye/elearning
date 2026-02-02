const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

exports.enrollToCourse = async (req, res) => {
  const { courseId } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

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
    [
      {
        $set: {
          progress: {
            $min: [100, { $max: [0, value] }]
          }
        }
      }
    ],
    { new: true }
  );

  res.json(enrollment);
};
