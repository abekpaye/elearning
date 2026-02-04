const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const QuizAttempt = require("../models/QuizAttempt");
const User = require("../models/User");

exports.getCourseEngagement = async (req, res) => {
  try {
    const { courseId } = req.query;

    const instructorCourses = await Course.find(
      { instructorId: req.user.id },
      { _id: 1 }
    );

    const courseIds = instructorCourses.map(c => c._id);

    const pipeline = [
      {
        $match: {
          courseId: { $in: courseIds }
        }
      }
    ];

    if (courseId) {
      pipeline.push({
        $match: { courseId: new mongoose.Types.ObjectId(courseId) }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: "$courseId",
          studentsCount: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
          activeStudents: {
            $sum: {
              $cond: [{ $gte: ["$progress", 50] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 0,
          courseId: "$course._id",
          courseTitle: "$course.title",
          studentsCount: 1,
          avgProgress: { $round: ["$avgProgress", 1] },
          activeStudents: 1
        }
      },
      { $sort: { studentsCount: -1 } }
    );

    const analytics = await Enrollment.aggregate(pipeline);


    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTopStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user.id
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" });
    }

    const pipeline = [
      {
        $lookup: {
          from: "courses",
          let: { quizId: "$quizId" },
          pipeline: [
            { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
            { $unwind: "$quizzes" },
            {
              $match: {
                $expr: { $eq: ["$quizzes._id", "$$quizId"] }
              }
            }
          ],
          as: "courseQuiz"
        }
      },
      { $unwind: "$courseQuiz" },

      {
        $group: {
          _id: "$studentId",
          avgScore: { $avg: "$score" },
          attempts: { $sum: 1 }
        }
      },

      { $sort: { avgScore: -1 } },
      { $limit: 10 },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },

      {
        $project: {
          _id: 0,
          studentId: "$student._id",
          name: "$student.name",
          email: "$student.email",
          avgScore: { $round: ["$avgScore", 1] },
          attempts: 1
        }
      }
    ];

    const topStudents = await QuizAttempt.aggregate(pipeline);

    res.json(topStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};