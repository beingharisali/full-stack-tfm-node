const express = require("express");
const {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasks,
} = require("../controllers/TaskController");
const router = express.Router();

router.get("/get-tasks", getAllTasks);
router.get("/get-task/:id", getTaskById);
router.post("/create-task", createTask);
router.put("/update-task/:id", updateTask);
router.delete("/delete-task/:id", deleteTask);

module.exports = router;
