const express = require("express");
const {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasks,
  getWorkspaceTasks,
} = require("../controllers/TaskController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-tasks", authMiddleware, getAllTasks);
router.get("/get-task/:id", authMiddleware, getTaskById);
router.post("/create-task", authMiddleware, createTask);
router.put("/update-task/:id", authMiddleware, updateTask);
router.delete("/delete-task/:id", authMiddleware, deleteTask);
router.get("/workspace/:workspaceId", authMiddleware, getWorkspaceTasks);

module.exports = router;