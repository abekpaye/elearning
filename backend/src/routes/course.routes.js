const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createCourse,
  getCourses,
  getCourseById,
  addLesson,
  addQuiz
} = require("../controllers/course.controller");
const { updateCourse, deleteCourse } = require("../controllers/course.controller");

router.post("/", auth, role("instructor"), createCourse);
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post("/:id/lessons", auth, role("instructor"), addLesson);
router.post("/:id/quizzes", auth, role("instructor"), addQuiz);
router.patch("/:id", auth, role("instructor", "admin"), updateCourse);
router.delete("/:id", auth, role("instructor", "admin"), deleteCourse);

module.exports = router
