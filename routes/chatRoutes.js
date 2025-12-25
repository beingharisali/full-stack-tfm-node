const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  searchMessages,
  getUnreadCount,
} = require("../controllers/ChatController");

router.post("/send", protect, sendMessage);
router.get("/unread-count", protect, getUnreadCount);
router.get("/search", protect, searchMessages);
router.get("/:userId", protect, getMessages);
router.put("/:id", protect, editMessage);
router.delete("/:id", protect, deleteMessage);

module.exports = router;
