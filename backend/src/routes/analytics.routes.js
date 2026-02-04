const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getCourseEngagement
} = require("../controllers/analytics.controller");

router.get(
  "/course-engagement",
  auth,
  role("instructor"),
  getCourseEngagement
);

module.exports = router;
