const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createAttempt,
  deleteLowScores
} = require("../controllers/quiz.controller");

router.post("/attempts", auth, role("student"), createAttempt);
router.delete("/attempts/low", auth, role("admin"), deleteLowScores);

module.exports = router;
