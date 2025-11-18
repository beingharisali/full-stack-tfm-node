const express = require("express");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/NotificationController");

const router = express.Router();

router.get("/user/:userId", getUserNotifications);
router.get("/user/:userId/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/user/:userId/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
