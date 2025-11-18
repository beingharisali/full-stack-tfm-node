const notificationModel = require("../models/Notification");

getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { unreadOnly } = req.query;

    const filter = { recipient: userId };
    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const notifications = await notificationModel
      .find(filter)
      .populate("task", "title status priority")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await notificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findByIdAndDelete(id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await notificationModel.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
