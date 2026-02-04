const express = require("express");
const router = express.Router();

const Enrollment = require("../models/Enrollment");
const authMiddleware = require("../middleware/auth.middleware"); 
const Course = require("../models/Course");
const role = require("../middleware/role.middleware");

router.post("/", authMiddleware, role("student"), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    const exists = await Enrollment.findOne({ studentId, courseId });
    if (exists) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    const enrollment = await Enrollment.create({
      studentId,
      courseId
    });

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.find({ studentId })
      .populate("courseId");

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;