const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  enrollToCourse,
  updateProgress
} = require("../controllers/enrollment.controller");

router.post("/", auth, role("student"), enrollToCourse);
router.patch("/progress", auth, role("student"), updateProgress);

module.exports = router;
