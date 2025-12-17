const express = require("express");
const { register, login, getProfile, updateProfile, getAllUsers, getUserByEmail, getOnlineUsers } = require("../controllers/AuthController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/users", authMiddleware, getAllUsers);
router.get("/user-by-email", authMiddleware, getUserByEmail);
router.get("/online-users", authMiddleware, getOnlineUsers);

module.exports = router;