const express = require("express");
const {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasks,
} = require("../controllers/TaskController");
const router = express.Router();

router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
