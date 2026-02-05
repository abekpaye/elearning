const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const QuizAttempt = require("../models/QuizAttempt");

exports.createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;

    const course = await Course.create({
      title,
      description,
      instructorId: req.user.id
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .select("-quizzes.tasks.correctOptionId");

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const course = await Course.findById(id)
      .select("-quizzes.tasks.correctOptionId");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (role === "instructor") {
      if (course.instructorId.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (role === "student") {
      const enrolled = await Enrollment.exists({
        studentId: userId,
        courseId: id
      });

      if (!enrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }
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

    const course = await Course.findOneAndUpdate(
      { _id: id, instructorId: req.user.id },
      { $push: { lessons: { title, content, videoUrl, orderNumber } } },
      { new: true }
    );

    if (!course) {
      return res.status(403).json({ message: "Access denied or course not found" });
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

    if (!title) {
      return res.status(400).json({ message: "Quiz title is required" });
    }

    // tasks can be optional
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    // Normalize tasks to required schema:
    // task: { question, options:[{_id,text}], correctOptionId }
    const normalizedTasks = safeTasks.map((t) => {
      const question = (t?.question || "").trim();
      if (!question) {
        throw new Error("Each task must have a question");
      }

      // options can be ["A","B"] or [{text:"A"}] etc.
      const rawOptions = Array.isArray(t?.options) ? t.options : [];
      if (rawOptions.length < 2) {
        throw new Error("Each task must have at least 2 options");
      }

      // Build option docs with ObjectIds
      const optionDocs = rawOptions.map((o) => {
        const text = typeof o === "string" ? o : (o?.text || "");
        const clean = String(text).trim();
        if (!clean) throw new Error("Option text cannot be empty");
        return {
          _id: o?._id ? o._id : new Course.db.base.Types.ObjectId(),
          text: clean
        };
      });

      // correctOptionId may be provided OR correctIndex
      let correctOptionId = t?.correctOptionId || null;

      if (!correctOptionId && Number.isInteger(t?.correctIndex)) {
        const idx = t.correctIndex;
        if (idx < 0 || idx >= optionDocs.length) {
          throw new Error("correctIndex is out of range");
        }
        correctOptionId = optionDocs[idx]._id;
      }

      if (!correctOptionId) {
        throw new Error("Each task must have correctOptionId or correctIndex");
      }

      return {
        question,
        options: optionDocs,
        correctOptionId
      };
    });

    const course = await Course.findOneAndUpdate(
      { _id: id, instructorId: req.user.id },
      { $push: { quizzes: { title, tasks: normalizedTasks } } },
      { new: true }
    );

    if (!course) {
      return res
        .status(403)
        .json({ message: "Access denied or course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

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

exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      instructorId: req.user.id
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
