const notificationModel = require("../models/Notification");
const userModel = require("../models/User");
const workspaceModel = require("../models/Workspace");

const createNotification = async (recipientId, type, taskId, message, metadata = {}) => {
  try {
    const notificationData = {
      recipient: recipientId,
      type,
      message,
      metadata,
    };
    
    // Only add task field if taskId is provided
    if (taskId) {
      notificationData.task = taskId;
    }
    
    const notification = await notificationModel.create(notificationData);
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

const notifyTaskCreated = async (io, task, createdBy = "System") => {
  // If the task is assigned to someone, notify the assignee
  if (task.assignee) {
    const message = `A new task "${task.title}" has been created and assigned to you by ${createdBy}`;
    const notification = await createNotification(
      task.assignee,
      "task_assigned",
      task._id,
      message,
      {
        taskTitle: task.title,
        assignedBy: createdBy,
      }
    );

    if (notification) {
      emitNotification(io, task.assignee, notification);
    }

    return notification;
  }
  
  // If the task is assigned by email, find the user and notify them
  if (task.assigneeEmail) {
    try {
      const user = await userModel.findOne({ email: task.assigneeEmail });
      if (user) {
        const message = `A new task "${task.title}" has been created and assigned to you by ${createdBy}`;
        const notification = await createNotification(
          user._id,
          "task_assigned",
          task._id,
          message,
          {
            taskTitle: task.title,
            assignedBy: createdBy,
          }
        );

        if (notification) {
          emitNotification(io, user._id, notification);
        }

        return notification;
      }
    } catch (error) {
      console.error("Error finding user by email for task creation notification:", error);
    }
  }
  
  // If the task is in a workspace, notify workspace admins/creators
  if (task.workspace) {
    try {
      const workspace = await workspaceModel.findById(task.workspace);
      if (workspace) {
        // Notify the workspace creator/admin
        const adminNotification = await createNotification(
          workspace.createdBy,
          "task_created",
          task._id,
          `A new task "${task.title}" has been created in workspace "${workspace.name}" by ${createdBy}.`,
          {
            taskTitle: task.title,
            workspaceName: workspace.name,
            createdBy: createdBy,
          }
        );
        
        if (adminNotification && io) {
          emitNotification(io, workspace.createdBy, adminNotification);
        }
        
        // Notify other workspace members (admins) if they exist
        for (const memberId of workspace.members) {
          if (memberId.toString() !== workspace.createdBy.toString()) {
            const memberNotification = await createNotification(
              memberId,
              "task_created",
              task._id,
              `A new task "${task.title}" has been created in workspace "${workspace.name}" by ${createdBy}.`,
              {
                taskTitle: task.title,
                workspaceName: workspace.name,
                createdBy: createdBy,
              }
            );
            
            if (memberNotification && io) {
              emitNotification(io, memberId, memberNotification);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error finding workspace for task creation notification:", error);
    }
  }
  
  return null;
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
  notifyTaskCreated,
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyTaskCompleted,
};
