const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createAttempt
} = require("../controllers/quiz.controller");

router.post("/attempts", auth, role("student"), createAttempt);

module.exports = router;