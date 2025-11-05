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

module.exports = { register, login };
