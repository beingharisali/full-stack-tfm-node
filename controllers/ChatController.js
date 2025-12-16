const mongoose = require("mongoose");
const chatRequestModel = require("../models/ChatRequest");
const chatConnectionModel = require("../models/ChatConnection");
const chatMessageModel = require("../models/ChatMessage");
const userModel = require("../models/User");

const sendChatRequest = async (req, res) => {
  try {
    const { requesterId, requesterName, recipientEmail } = req.body;
    
    const recipient = await userModel.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        message: "User with this email not found" 
      });
    }
    
    const existingRequest = await chatRequestModel.findOne({
      requester: requesterId,
      recipient: recipient._id,
      status: { $in: ["pending", "accepted"] }
    });
    
    if (existingRequest) {
      if (existingRequest.status === "accepted") {
        return res.status(400).json({ 
          success: false, 
          message: "You are already connected with this user" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "A chat request is already pending for this user" 
        });
      }
    }
    
    const chatRequest = await chatRequestModel.create({
      requester: new mongoose.Types.ObjectId(requesterId),
      recipient: recipient._id,
      recipientEmail: recipientEmail,
    });
    
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting chatRequest event to room:', recipient._id.toString());
      io.to(recipient._id.toString()).emit("chatRequest", {
        _id: chatRequest._id,
        requester: chatRequest.requester,
        requesterName: requesterName,
        recipient: chatRequest.recipient,
        recipientEmail: chatRequest.recipientEmail,
        status: chatRequest.status,
        createdAt: chatRequest.createdAt,
      });
      console.log('ChatRequest event emitted successfully');
    } else {
      console.log('IO instance not available');
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Chat request sent successfully",
      chatRequest 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error sending chat request",
      error: error.message 
    });
  }
};

const respondToChatRequest = async (req, res) => {
  try {
    const { requestId, status, responderId } = req.body;
    
    const chatRequest = await chatRequestModel.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat request not found" 
      });
    }
    
    if (chatRequest.recipient.toString() !== responderId) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to respond to this request" 
      });
    }
    
    chatRequest.status = status;
    await chatRequest.save();
    
    if (status === "accepted") {
      try {
        const existingConnection = await chatConnectionModel.findOne({
          $or: [
            { user1: chatRequest.requester, user2: chatRequest.recipient },
            { user1: chatRequest.recipient, user2: chatRequest.requester }
          ]
        });
        
        if (!existingConnection) {
          const requester = await userModel.findById(chatRequest.requester);
          
          await chatConnectionModel.create({
            user1: chatRequest.requester,
            user2: chatRequest.recipient,
            user1Email: requester ? requester.email : "Unknown",
            user2Email: chatRequest.recipientEmail,
          });
        }
      } catch (connectionError) {
        console.error("Error creating chat connection:", connectionError);
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Chat request ${status}`,
      chatRequest 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error responding to chat request",
      error: error.message 
    });
  }
};

const getUserChatRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const chatRequests = await chatRequestModel
      .find({ 
        $or: [
          { requester: userId },
          { recipient: userId }
        ]
      })
      .populate("requester", "firstName lastName email")
      .populate("recipient", "firstName lastName email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: chatRequests.length,
      chatRequests 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching chat requests",
      error: error.message 
    });
  }
};

const sendPrivateMessage = async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;
    
    const isAllowed = await checkConnection(senderId, recipientId);
    if (!isAllowed) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not connected with this user" 
      });
    }
    
    const message = await chatMessageModel.create({
      sender: senderId,
      recipient: recipientId,
      content,
    });
    
    res.status(201).json({ 
      success: true, 
      message: "Message sent successfully",
      chatMessage: message 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error sending message",
      error: error.message 
    });
  }
};

const checkConnection = async (user1Id, user2Id) => {
  const acceptedRequest = await chatRequestModel.findOne({
    $or: [
      { requester: user1Id, recipient: user2Id, status: "accepted" },
      { requester: user2Id, recipient: user1Id, status: "accepted" }
    ]
  });
  
  if (acceptedRequest) return true;
  
  const connection = await chatConnectionModel.findOne({
    $or: [
      { user1: user1Id, user2: user2Id },
      { user1: user2Id, user2: user1Id }
    ]
  });
  
  return !!connection;
};

const getChatMessages = async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    
    const isAllowed = await checkConnection(user1Id, user2Id);
    if (!isAllowed) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not connected with this user" 
      });
    }
    
    const messages = await chatMessageModel
      .find({
        $or: [
          { sender: user1Id, recipient: user2Id },
          { sender: user2Id, recipient: user1Id }
        ]
      })
      .populate("sender", "firstName lastName email")
      .populate("recipient", "firstName lastName email")
      .sort({ createdAt: 1 });
    
    res.status(200).json({ 
      success: true, 
      count: messages.length,
      messages 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching messages",
      error: error.message 
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    const message = await chatMessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }
    
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only delete your own messages" 
      });
    }
    
    message.deleted = true;
    await message.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Message deleted successfully",
      chatMessage: message 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error deleting message",
      error: error.message 
    });
  }
};

module.exports = {
  sendChatRequest,
  respondToChatRequest,
  getUserChatRequests,
  sendPrivateMessage,
  getChatMessages,
  deleteMessage,
  checkConnection
};