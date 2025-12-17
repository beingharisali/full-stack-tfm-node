const taskModel = require("../models/Task");
const Workspace = require("../models/Workspace");
const {
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyTaskCompleted,
} = require("../services/notificationService");

createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      ...(req.body.workspace && { workspace: req.body.workspace })
    };

    const task = await taskModel.create(taskData);
    
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
    // If a workspace is specified, filter by it
    if (req.query.workspace) {
      // Check if user has access to this workspace
      const workspace = await Workspace.findOne({
        _id: req.query.workspace,
        $or: [
          { members: req.user.id },
          { createdBy: req.user.id }
        ]
      });

      if (!workspace) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have access to this workspace" 
        });
      }

      const tasks = await taskModel.find({ workspace: req.query.workspace }).populate("assignee", "name email");
      return res.status(200).json({ success: true, count: tasks.length, tasks });
    }
    
    // If no workspace specified, get tasks that are either:
    // 1. Not in any workspace
    // 2. In workspaces the user has access to
    const userWorkspaces = await Workspace.find({
      $or: [
        { members: req.user.id },
        { createdBy: req.user.id }
      ]
    });

    const workspaceIds = userWorkspaces.map(ws => ws._id);
    
    // Get tasks that are either not in any workspace or in workspaces the user has access to
    const tasks = await taskModel.find({
      $or: [
        { workspace: { $exists: false } },
        { workspace: { $exists: true, $in: workspaceIds } },
        { workspace: null }
      ]
    }).populate("assignee", "name email");
    
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

    if (task.workspace) {
      const workspace = await Workspace.findOne({
        _id: task.workspace,
        $or: [
          { members: req.user.id },
          { createdBy: req.user.id }
        ]
      });

      if (!workspace) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have access to this task" 
        });
      }
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

    if (oldTask.workspace) {
      const workspace = await Workspace.findOne({
        _id: oldTask.workspace,
        $or: [
          { members: req.user.id },
          { createdBy: req.user.id }
        ]
      });

      if (!workspace) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have access to this task" 
        });
      }
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
    const task = await taskModel.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    if (task.workspace) {
      const workspace = await Workspace.findOne({
        _id: task.workspace,
        $or: [
          { members: req.user.id },
          { createdBy: req.user.id }
        ]
      });

      if (!workspace) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have access to this task" 
        });
      }
    }

    await taskModel.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

getWorkspaceTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { members: req.user.id },
        { createdBy: req.user.id }
      ]
    });

    if (!workspace) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have access to this workspace" 
      });
    }

    const tasks = await taskModel.find({ workspace: workspaceId }).populate("assignee", "name email");
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getWorkspaceTasks
};