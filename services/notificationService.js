const notificationModel = require("../models/Notification");
const userModel = require("../models/User");

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
  if (task.assignee) {
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
  }
  
  if (task.assigneeEmail) {
    try {
      const user = await userModel.findOne({ email: task.assigneeEmail });
      if (user) {
        const message = `You have been assigned a new task: "${task.title}"`;
        const notification = await createNotification(
          user._id,
          "task_assigned",
          task._id,
          message,
          {
            taskTitle: task.title,
            assignedBy,
          }
        );

        if (notification) {
          emitNotification(io, user._id, notification);
        }

        return notification;
      }
    } catch (error) {
      console.error("Error finding user by email for notification:", error);
    }
  }
  
  return null;
};

const notifyTaskUpdated = async (io, task, previousStatus, updatedBy = "System") => {
  let recipientId = task.assignee;
  
  if (!recipientId && task.assigneeEmail) {
    try {
      const user = await userModel.findOne({ email: task.assigneeEmail });
      if (user) {
        recipientId = user._id;
      }
    } catch (error) {
      console.error("Error finding user by email for notification:", error);
    }
  }
  
  if (!recipientId) return;

  const message = `Task "${task.title}" has been updated from ${previousStatus} to ${task.status}`;
  const notification = await createNotification(
    recipientId,
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
    emitNotification(io, recipientId, notification);
  }

  return notification;
};

const notifyTaskCompleted = async (io, task, completedBy = "System") => {
  let recipientId = task.assignee;
  
  if (!recipientId && task.assigneeEmail) {
    try {
      const user = await userModel.findOne({ email: task.assigneeEmail });
      if (user) {
        recipientId = user._id;
      }
    } catch (error) {
      console.error("Error finding user by email for notification:", error);
    }
  }
  
  if (!recipientId) return;

  const message = `Task "${task.title}" has been marked as completed`;
  const notification = await createNotification(
    recipientId,
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
    emitNotification(io, recipientId, notification);
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
