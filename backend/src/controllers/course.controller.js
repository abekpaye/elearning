const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const QuizAttempt = require("../models/QuizAttempt");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, price } = req.body;

    const course = await Course.create({
      title,
      description,
      price,
      instructorId: req.user.id,
      lessons: [],
      quizzes: []
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, videoUrl, orderNumber } = req.body;

    const course = await Course.findByIdAndUpdate(
      id,
      {
        $push: {
          lessons: { title, content, videoUrl, orderNumber }
        }
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tasks } = req.body;

    const course = await Course.findByIdAndUpdate(
      id,
      {
        $push: {
          quizzes: { title, tasks }
        }
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (
      course.instructorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;

    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (
      course.instructorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Course.findByIdAndDelete(id);
    await Enrollment.deleteMany({ courseId: id });
    await QuizAttempt.deleteMany({
      quizId: { $in: course.quizzes.map(q => q._id) }
    });

    res.json({ message: "Course and related data deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
