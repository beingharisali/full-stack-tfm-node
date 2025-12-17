const express = require("express");
const {
  createWorkspace,
  updateWorkspace,
  inviteMembers,
  getWorkspaceInvitations,
  respondToInvitation,
  getUserWorkspaces,
  getWorkspaceById,
  leaveWorkspace
} = require("../controllers/WorkspaceController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createWorkspace);
router.get("/:id", authMiddleware, getWorkspaceById);
router.put("/update/:id", authMiddleware, updateWorkspace);
router.post("/invite/:id", authMiddleware, inviteMembers);
router.get("/invitations", authMiddleware, getWorkspaceInvitations);
router.post("/invitations/respond", authMiddleware, respondToInvitation);
router.delete("/leave/:id", authMiddleware, leaveWorkspace);
router.get("/user-workspaces", authMiddleware, getUserWorkspaces);

module.exports = router;