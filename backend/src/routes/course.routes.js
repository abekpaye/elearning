const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createCourse,
  getCourses,
  getCourseById,
  addLesson,
  addQuiz,
  updateLesson
} = require("../controllers/course.controller");
const { updateCourse, deleteCourse } = require("../controllers/course.controller");
const { getMyCourses } = require("../controllers/course.controller");

router.post("/", auth, role("instructor"), createCourse);
router.get("/", auth, getCourses);
router.get("/my", auth, role("instructor"), getMyCourses);
router.get("/:id", auth, getCourseById);
router.post("/:id/lessons", auth, role("instructor"), addLesson);
router.post("/:id/quizzes", auth, role("instructor"), addQuiz);
router.patch("/:id", auth, role("instructor"), updateCourse);
router.delete("/:id", auth, role("instructor"), deleteCourse);
router.patch(
  "/:courseId/lessons/:lessonId",
  auth,
  role("instructor"),
  updateLesson
);

module.exports = router
