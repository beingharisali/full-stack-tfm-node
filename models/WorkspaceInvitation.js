const mongoose = require("mongoose");

const workspaceInvitationSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invitedByEmail: {
    type: String,
    required: true,
  },
  invitedUserName: {
    type: String,
    required: true,
  },
  workspaceName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const workspaceInvitationModel = mongoose.model("WorkspaceInvitation", workspaceInvitationSchema);

module.exports = workspaceInvitationModel;