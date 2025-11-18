const express = require("express");
const {
  createWorkspace,
  updateWorkspace,
  inviteMembers,
} = require("../controllers/WorkspaceController");
const router = express.Router();

router.post("/create", createWorkspace);
router.put("/update/:id", updateWorkspace);
router.post("/invite/:id", inviteMembers);

module.exports = router;
