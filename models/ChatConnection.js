const mongoose = require("mongoose");

const chatConnectionSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user1Email: {
    type: String,
    required: true,
  },
  user2Email: {
    type: String,
    required: true,
  },
}, { timestamps: true });

chatConnectionSchema.index({ user1: 1, user2: 1 }, { unique: true });
chatConnectionSchema.index({ user2: 1, user1: 1 }, { unique: true });

const chatConnectionModel = mongoose.model("ChatConnection", chatConnectionSchema);
module.exports = chatConnectionModel;