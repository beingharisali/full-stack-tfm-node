const Workspace = require("../models/Workspace");
const User = require("../models/User");
const WorkspaceInvitation = require("../models/WorkspaceInvitation");

const createWorkspace = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create workspaces",
      });
    }

    const workspaceData = {
      ...req.body,
      createdBy: req.user.id,
      members: [req.user.id],
    };

    console.log("Creating workspace with data:", workspaceData);
    const workspace = await Workspace.create(workspaceData);
    console.log("Created workspace:", workspace);

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate(
      "members",
      "firstName lastName email role"
    );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member._id.toString() === req.user.id
    );
    const isCreator = workspace.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this workspace",
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
        message: "Only admins can update workspaces",
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
    console.log(
      "Invite members request:",
      req.body,
      req.params.id,
      req.user.id
    );
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can invite members to workspaces",
      });
    }

    const { members } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });
    }

    console.log("Inviting members to workspace:", workspace.name, members);
    const invitations = [];
    for (const memberId of members) {
      const user = await User.findById(memberId);
      if (user) {
        console.log("Processing user:", user.email, user._id);
        const existingInvitation = await WorkspaceInvitation.findOne({
          workspace: workspace._id,
          invitedUser: user._id,
          status: "pending",
        });

        if (existingInvitation) {
          console.log("Existing invitation found for user:", user.email);
        } else {
          console.log("Creating new invitation for user:", user.email);
          const invitation = await WorkspaceInvitation.create({
            workspace: workspace._id,
            invitedUser: user._id,
            invitedByEmail: user.email,
            invitedUserName: `${user.firstName} ${user.lastName}`,
            workspaceName: workspace.name,
            invitedBy: req.user.id,
          });
          invitations.push(invitation);
        }
      }
    }

    console.log("Created invitations:", invitations);
    res.status(200).json({
      success: true,
      message: "Invitations sent successfully",
      invitations,
    });
  } catch (error) {
    console.error("Error inviting members:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getWorkspaceInvitations = async (req, res) => {
  try {
    console.log("Fetching invitations for user:", req.user.id);
    const invitations = await WorkspaceInvitation.find({
      invitedUser: req.user.id,
      status: "pending",
    })
      .populate("workspace", "name")
      .populate("invitedBy", "firstName lastName email");

    console.log("Found invitations:", invitations);

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
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
        message: "Invitation not found",
      });
    }

    if (invitation.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to respond to this invitation",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This invitation has already been responded to",
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
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === userId
    );
    const isCreator = workspace.createdBy.toString() === userId;

    if (isCreator) {
      return res.status(400).json({
        success: false,
        message: "Workspace creator cannot leave the workspace",
      });
    }

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this workspace",
      });
    }

    workspace.members = workspace.members.filter(
      (member) => member.toString() !== userId
    );
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
    console.log(
      "Fetching workspaces for user:",
      req.user.id,
      "with role:",
      req.user.role
    );

    let workspaces;
    if (req.user.role === "admin") {
      console.log("User is admin, fetching all workspaces");
      workspaces = await Workspace.find({}).populate(
        "members",
        "firstName lastName email role"
      );
    } else {
      console.log("User is not admin, fetching user-specific workspaces");
      workspaces = await Workspace.find({
        $or: [{ members: req.user.id }, { createdBy: req.user.id }],
      }).populate("members", "firstName lastName email role");
    }

    console.log("Found workspaces count:", workspaces.length);
    console.log("Workspaces data:", JSON.stringify(workspaces, null, 2));

    res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
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
  getUserWorkspaces,
};
