const taskModel = require("../models/Task");
const {
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyTaskCompleted,
} = require("../services/notificationService");

createTask = async (req, res) => {
  try {
    const task = await taskModel.create(req.body);
    
    const io = req.app.get("io");
    if (task.assignee && io) {
      await notifyTaskAssigned(io, task, req.user?.name || "Admin");
    }

    res
      .status(201)
      .json({ success: true, message: "Task Created", task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

getAllTasks = async (req, res) => {
  try {
    const tasks = await taskModel.find().populate("assignee", "name email");
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

getTaskById = async (req, res) => {
  try {
    const task = await taskModel
      .findById(req.params.id)
      .populate("assignee", "name email");

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

updateTask = async (req, res) => {
  try {
    const oldTask = await taskModel.findById(req.params.id);
    if (!oldTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const previousStatus = oldTask.status;
    const previousAssignee = oldTask.assignee;

    const task = await taskModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const io = req.app.get("io");
    if (io) {
      if (task.assignee && !previousAssignee) {
        await notifyTaskAssigned(io, task, req.user?.name || "Admin");
      } else if (task.status === "completed" && previousStatus !== "completed") {
        await notifyTaskCompleted(io, task, req.user?.name || "System");
      } else if (previousStatus !== task.status) {
        await notifyTaskUpdated(io, task, previousStatus, req.user?.name || "System");
      } else if (task.assignee && task.assignee.toString() !== previousAssignee?.toString()) {
        await notifyTaskAssigned(io, task, req.user?.name || "Admin");
      }
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

deleteTask = async (req, res) => {
  try {
    const task = await taskModel.findByIdAndDelete(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
