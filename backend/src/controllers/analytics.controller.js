const Enrollment = require("../models/Enrollment");

exports.getCourseEngagement = async (req, res) => {
  try {
    const { courseId } = req.query;

    const pipeline = [];

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
