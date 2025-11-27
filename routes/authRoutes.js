const express = require("express");
const { register, login, getProfile, updateProfile, getAllUsers } = require("../controllers/AuthController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/users", authMiddleware, getAllUsers);

module.exports = router;