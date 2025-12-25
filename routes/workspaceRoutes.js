const express = require("express");
const {
  createWorkspace,
  updateWorkspace,
  addMembers,
  getUserWorkspaces,
  getWorkspaceById,
  leaveWorkspace,
  deleteWorkspace,
} = require("../controllers/WorkspaceController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createWorkspace);
router.get("/user-workspaces", authMiddleware, getUserWorkspaces);
router.get("/:id", authMiddleware, getWorkspaceById);
router.put("/update/:id", authMiddleware, updateWorkspace);
router.post("/:id/add-members", authMiddleware, addMembers);
router.delete("/leave/:id", authMiddleware, leaveWorkspace);
router.delete("/:id", authMiddleware, deleteWorkspace);

module.exports = router;
