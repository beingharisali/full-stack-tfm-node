const ChatMessage = require("../models/ChatMessage");
const Workspace = require("../models/Workspace");


const hasPermission = async (u1, u2) => {

  return true;
};


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


exports.deleteMessage = async (req, res) => {
  const chat = await ChatMessage.findById(req.params.id);

  if (!chat || chat.sender.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await chat.deleteOne();
  res.json({ message: "Message deleted" });
};


exports.searchMessages = async (req, res) => {
  const messages = await ChatMessage.find({
    receiver: req.user.id,
    message: { $regex: req.query.keyword, $options: "i" },
  });

  res.json(messages);
};


exports.getUnreadCount = async (req, res) => {
  const count = await ChatMessage.countDocuments({
    receiver: req.user.id,
    isRead: false,
  });

  res.json({ count });
};
