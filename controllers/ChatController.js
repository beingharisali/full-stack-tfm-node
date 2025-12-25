const ChatMessage = require("../models/ChatMessage");
const Workspace = require("../models/Workspace");

/* ================= PERMISSION ================= */

const hasPermission = async (u1, u2) => {
  // Allow any authenticated users to chat with each other
  // In a real implementation, you might want to add additional checks
  // such as if users are connected in some way
  return true;
};

/* ================= SEND ================= */

exports.sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;

  const allowed = await hasPermission(
    req.user.id,
    receiverId
  );

  if (!allowed) {
    return res.status(403).json({ message: "Chat not allowed" });
  }

  const chat = await ChatMessage.create({
    sender: req.user.id,
    receiver: receiverId,
    message,
  });

  res.status(201).json(chat);
};

/* ================= GET ================= */

exports.getMessages = async (req, res) => {
  const { userId } = req.params;

  const allowed = await hasPermission(
    req.user.id,
    userId
  );

  if (!allowed) {
    return res.status(403).json({ message: "Access denied" });
  }

  const chats = await ChatMessage.find({
    $or: [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id },
    ],
  }).sort({ createdAt: 1 });

  // ✔✔ Seen
  await ChatMessage.updateMany(
    {
      sender: userId,
      receiver: req.user.id,
      isRead: false,
    },
    { isRead: true }
  );

  res.json(chats);
};

/* ================= EDIT ================= */

exports.editMessage = async (req, res) => {
  const chat = await ChatMessage.findById(req.params.id);

  if (!chat || chat.sender.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  chat.message = req.body.message;
  chat.isEdited = true;
  await chat.save();

  res.json(chat);
};

/* ================= DELETE ================= */

exports.deleteMessage = async (req, res) => {
  const chat = await ChatMessage.findById(req.params.id);

  if (!chat || chat.sender.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await chat.deleteOne();
  res.json({ message: "Message deleted" });
};

/* ================= SEARCH ================= */

exports.searchMessages = async (req, res) => {
  const messages = await ChatMessage.find({
    receiver: req.user.id,
    message: { $regex: req.query.keyword, $options: "i" },
  });

  res.json(messages);
};

/* ================= UNREAD ================= */

exports.getUnreadCount = async (req, res) => {
  const count = await ChatMessage.countDocuments({
    receiver: req.user.id,
    isRead: false,
  });

  res.json({ count });
};
