const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { deleteUser } = require("../controllers/user.controller");

router.delete("/:id", auth, role("admin"), deleteUser);

module.exports = router;
