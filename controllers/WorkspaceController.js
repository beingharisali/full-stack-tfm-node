const Workspace = require("../models/Workspace");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

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

const deleteWorkspace = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete workspaces",
      });
    }
    
    const workspaceId = req.params.id;
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    await Workspace.findByIdAndDelete(workspaceId);
    
    res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const addMembers = async (req, res) => {
  try {
    console.log(
      "Add members to workspace request:",
      req.body,
      req.params.id,
      req.user.id
    );
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can add members to workspaces",
      });
    }

    const { members } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });
    }

    console.log("Adding members to workspace:", workspace.name, members);
    
    const io = req.app.get('io');
    
    const addedUsers = [];
    
    for (const memberId of members) {
      const user = await User.findById(memberId);
      if (user) {
        console.log("Processing user:", user.email, user._id);
        
        if (!workspace.members.includes(user._id)) {
          workspace.members.push(user._id);
          
          try {
            const userNotification = await createNotification(
              user._id,
              "workspace_added",
              null,
              `Admin ${req.user.firstName} ${req.user.lastName} has added you to workspace: ${workspace.name}. You can now access the workspace.`,
              {
                workspaceName: workspace.name,
                workspaceId: workspace._id,
                addedBy: req.user.firstName + " " + req.user.lastName,
              }
            );
            
            if (userNotification && io) {
              io.to(user._id.toString()).emit("notification", userNotification);
            }
            
            addedUsers.push(user);
          } catch (notificationError) {
            console.error("Error creating notification for workspace addition:", notificationError);
          }
        }
      }
    }
    
    await workspace.save();
    
    if (addedUsers.length > 0 && io) {
      try {
        const userNames = addedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ');
        const adminNotification = await createNotification(
          req.user.id,
          "workspace_updated",
          null,
          `You have successfully added ${userNames} to workspace: ${workspace.name}.`,
          {
            workspaceName: workspace.name,
            workspaceId: workspace._id,
            addedUsers: addedUsers.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}` })),
          }
        );
        
        if (adminNotification && io) {
          io.to(req.user.id.toString()).emit("notification", adminNotification);
        }
      } catch (adminNotificationError) {
        console.error("Error creating admin notification for workspace addition:", adminNotificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Members added to workspace successfully",
    });
  } catch (error) {
    console.error("Error adding members to workspace:", error);
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
  addMembers,
  leaveWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
};
