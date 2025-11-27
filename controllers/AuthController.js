const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

register = async (req, res) => {
	try {
		const { firstName, lastName, email, password, role } = req.body;

		const isUserExist = await User.findOne({ email });
		if (isUserExist) {
			return res.status(400).json({
				success: false,
				msg: "User already exist please use another email",
			});
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({
			firstName,
			lastName,
			email,
			password: hashedPassword,
			role,
		});

		res.status(201).json({ success: true, message: "User Registered", user });
	} catch (error) {
		res.status(400).json({
			success: false,
			error,
		});
	}
};

login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: "User not found" });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(401).json({ message: "Invalid password" });

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		res.json({
			success: true,
			message: "Login Successful",
			token,
			user: {
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				password: user.password,
				role: user.role,
			},
		});
	} catch (error) {
		res.status(400).json({
			error: error.message,
		});
	}
};

// Get user profile
getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json({ user });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

// Update user profile
updateProfile = async (req, res) => {
	try {
		const { firstName, lastName, email, password } = req.body;
		
		// Build user object
		const userFields = {};
		if (firstName) userFields.firstName = firstName;
		if (lastName) userFields.lastName = lastName;
		if (email) userFields.email = email;
		
		// If password is being updated, hash it
		if (password) {
			const salt = await bcrypt.genSalt(10);
			userFields.password = await bcrypt.hash(password, salt);
		}
		
		let user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		
		// Check if email is being changed and if it already exists
		if (email && email !== user.email) {
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				return res.status(400).json({ message: "Email already exists" });
			}
		}
		
		user = await User.findByIdAndUpdate(
			req.user.id,
			{ $set: userFields },
			{ new: true }
		).select("-password");
		
		res.json({ user });
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ message: "Server error" });
	}
};

// Get all users (admin only)
getAllUsers = async (req, res) => {
	try {
		// Only allow admin to access this endpoint
		if (req.user.role !== "admin") {
			return res.status(403).json({ message: "Access denied" });
		}
		
		// Get all users except the current admin, and exclude passwords
		const users = await User.find({ _id: { $ne: req.user.id } }).select("-password");
		res.json({ users });
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ message: "Server error" });
	}
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers };