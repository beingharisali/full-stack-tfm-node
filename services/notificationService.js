const notificationModel = require("../models/Notification");

const createNotification = async (recipientId, type, taskId, message, metadata = {}) => {
  try {
    const notification = await notificationModel.create({
      recipient: recipientId,
      type,
      task: taskId,
      message,
      metadata,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

const emitNotification = (io, userId, notification) => {
  if (io && userId) {
    io.to(userId.toString()).emit("notification", notification);
  }
};

const notifyTaskAssigned = async (io, task, assignedBy = "System") => {
  if (!task.assignee) return;

  const message = `You have been assigned a new task: "${task.title}"`;
  const notification = await createNotification(
    task.assignee,
    "task_assigned",
    task._id,
    message,
    {
      taskTitle: task.title,
      assignedBy,
    }
  );

  if (notification) {
    emitNotification(io, task.assignee, notification);
  }

  return notification;
};

const notifyTaskUpdated = async (io, task, previousStatus, updatedBy = "System") => {
  if (!task.assignee) return;

  const message = `Task "${task.title}" has been updated from ${previousStatus} to ${task.status}`;
  const notification = await createNotification(
    task.assignee,
    "task_updated",
    task._id,
    message,
    {
      taskTitle: task.title,
      previousStatus,
      newStatus: task.status,
      updatedBy,
    }
  );

  if (notification) {
    emitNotification(io, task.assignee, notification);
  }

  return notification;
};

const notifyTaskCompleted = async (io, task, completedBy = "System") => {
  if (!task.assignee) return;

  const message = `Task "${task.title}" has been marked as completed`;
  const notification = await createNotification(
    task.assignee,
    "task_completed",
    task._id,
    message,
    {
      taskTitle: task.title,
      newStatus: "completed",
      completedBy,
    }
  );

  if (notification) {
    emitNotification(io, task.assignee, notification);
  }

  return notification;
};

module.exports = {
  createNotification,
  emitNotification,
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyTaskCompleted,
};
