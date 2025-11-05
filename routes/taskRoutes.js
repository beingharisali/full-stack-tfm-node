const express = require("express");
const {
  createTask,
  getTaskById,
  updateTask,
} = require("../controllers/TaskController");
const router = express.Router();

router.get("/");
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id");

module.exports = router;
