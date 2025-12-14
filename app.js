require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const app = express();
const cors = require("cors");

const connectdb = require("./config/db");
const { notFound, globalErrorHandler } = require("./middlewares/errorHandler");

const port = process.env.PORT || 5000;
connectdb();

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.CLIENT_URL || "http://localhost:3000"|| "https://full-stack-tfm-next.vercel.app",
		methods: ["GET", "POST"],
		credentials: true
	}
});

app.use(express.json());

app.use(cors({}));
app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);

app.use(globalErrorHandler);

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	socket.on("join", (userId) => {
		socket.join(userId);
		console.log(`User ${userId} joined room`);
		socket.broadcast.emit("userOnline", userId);
	});

	socket.on("leave", (userId) => {
		socket.leave(userId);
		console.log(`User ${userId} left room`);
		socket.broadcast.emit("userOffline", userId);
	});

	socket.on("message", (data) => {
		console.log("Message received:", data);
		io.emit("message", data);
	});

	socket.on("privateMessage", (data) => {
		console.log("Private message received:", data);
		if (data.recipientId) {
			io.to(data.recipientId).emit("privateMessage", data);
		}
		if (data.senderId) {
			io.to(data.senderId).emit("privateMessage", data);
		}
	});

	socket.on("chatRequest", async (data) => {
		console.log("Chat request received:", data);
		
		try {
			const User = require("./models/User");
			const recipient = await User.findOne({ email: data.recipientEmail });
			
			if (recipient) {
				io.to(recipient._id.toString()).emit("chatRequest", data);
			} else {
				socket.emit("chatRequestError", { 
					message: "User with this email not found" 
				});
			}
		} catch (error) {
			console.error("Error processing chat request:", error);
			socket.emit("chatRequestError", { 
				message: "Error processing chat request" 
			});
		}
	});

	socket.on("chatRequestResponse", (data) => {
		console.log("Chat request response received:", data);
		if (data.requesterId) {
			io.to(data.requesterId.toString()).emit("chatRequestResponse", data);
		}
		
		if (data.responderId) {
			io.to(data.responderId.toString()).emit("chatRequestResponse", data);
		}
	});

	socket.on("typing", (data) => {
		if (data.recipientId) {
			socket.to(data.recipientId).emit("typing", data);
		}
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

app.set("io", io);

server.listen(port, () => {
	console.log(`Application is up and running on port ${port}`);
	console.log(`Socket.io server is ready`);
});
