const Workspace = require("../models/Workspace");
const User = require("../models/User");

createWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.create(req.body);

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

updateWorkspace = async (req, res) => {
  try {
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

inviteMembers = async (req, res) => {
  try {
    const { members } = req.body;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });
    }
    
    // Convert all IDs to strings to ensure Set removes duplicates
    const existingMembers = workspace.members.map(id => id.toString());
    const newMembers = members.map(id => id.toString());

    workspace.members = [...new Set([...existingMembers, ...newMembers])];

    await workspace.save();

    res.status(200).json({
      success: true,
      message: "Members invited successfully",
      workspace,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { createWorkspace, updateWorkspace, inviteMembers };
