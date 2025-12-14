const express = require("express");
const {
  sendChatRequest,
  respondToChatRequest,
  getUserChatRequests,
  sendPrivateMessage,
  getChatMessages,
  deleteMessage
} = require("../controllers/ChatController");

const router = express.Router();

router.post("/request", sendChatRequest);
router.post("/request/respond", respondToChatRequest);
router.get("/requests/:userId", getUserChatRequests);

router.post("/message", sendPrivateMessage);
router.get("/messages/:user1Id/:user2Id", getChatMessages);
router.delete("/message/:messageId", deleteMessage);

module.exports = router;