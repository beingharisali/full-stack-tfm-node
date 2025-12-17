const Workspace = require("../models/Workspace");
const User = require("../models/User");
const WorkspaceInvitation = require("../models/WorkspaceInvitation");

const createWorkspace = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can create workspaces" 
      });
    }

    const workspaceData = {
      ...req.body,
      createdBy: req.user.id
    };

    const workspace = await Workspace.create(workspaceData);

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate("members", "firstName lastName email role");

    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: "Workspace not found" 
      });
    }

    // Check if user has access to this workspace
    const isMember = workspace.members.some(member => member._id.toString() === req.user.id);
    const isCreator = workspace.createdBy.toString() === req.user.id;
    
    if (!isMember && !isCreator && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have access to this workspace" 
      });
    }

    res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can update workspaces" 
      });
    }

    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const inviteMembers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can invite members to workspaces" 
      });
    }

    const { members } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });
    }

    const invitations = [];
    for (const memberId of members) {
      const user = await User.findById(memberId);
      if (user) {
        const existingInvitation = await WorkspaceInvitation.findOne({
          workspace: workspace._id,
          invitedUser: user._id,
          status: "pending"
        });

        if (!existingInvitation) {
          const invitation = await WorkspaceInvitation.create({
            workspace: workspace._id,
            invitedUser: user._id,
            invitedByEmail: user.email,
            invitedUserName: `${user.firstName} ${user.lastName}`,
            workspaceName: workspace.name,
            invitedBy: req.user.id
          });
          invitations.push(invitation);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Invitations sent successfully",
      invitations,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getWorkspaceInvitations = async (req, res) => {
  try {
    const invitations = await WorkspaceInvitation.find({
      invitedUser: req.user.id,
      status: "pending"
    }).populate("workspace", "name").populate("invitedBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { invitationId, response } = req.body;

    const invitation = await WorkspaceInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ 
        success: false, 
        message: "Invitation not found" 
      });
    }

    if (invitation.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to respond to this invitation" 
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: "This invitation has already been responded to" 
      });
    }

    invitation.status = response;
    await invitation.save();

    if (response === "accepted") {
      const workspace = await Workspace.findById(invitation.workspace);
      if (workspace) {
        if (!workspace.members.includes(req.user.id)) {
          workspace.members.push(req.user.id);
          await workspace.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Invitation ${response}`,
      invitation,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const leaveWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: "Workspace not found" 
      });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(member => member.toString() === userId);
    const isCreator = workspace.createdBy.toString() === userId;
    
    // Creator cannot leave their own workspace
    if (isCreator) {
      return res.status(400).json({ 
        success: false, 
        message: "Workspace creator cannot leave the workspace" 
      });
    }

    if (!isMember) {
      return res.status(400).json({ 
        success: false, 
        message: "You are not a member of this workspace" 
      });
    }

    // Remove user from workspace members
    workspace.members = workspace.members.filter(member => member.toString() !== userId);
    await workspace.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the workspace",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { members: req.user.id },
        { createdBy: req.user.id }
      ]
    }).populate("members", "firstName lastName email role");

    res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { 
  createWorkspace, 
  getWorkspaceById,
  updateWorkspace, 
  inviteMembers, 
  getWorkspaceInvitations, 
  respondToInvitation,
  leaveWorkspace,
  getUserWorkspaces
};