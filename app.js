require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const app = express();
const cors = require("cors");

const connectdb = require("./config/db");
const { notFound, globalErrorHandler } = require("./middlewares/errorHandler");

const port = process.env.PORT || 5000;
connectdb();

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.CLIENT_URL || "http://localhost:3000"|| "https://full-stack-tfm-next.vercel.app/",
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

app.use(notFound);

app.use(globalErrorHandler);

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	socket.on("join", (userId) => {
		socket.join(userId);
		console.log(`User ${userId} joined room`);
	});

	socket.on("leave", (userId) => {
		socket.leave(userId);
		console.log(`User ${userId} left room`);
	});

	socket.on("message", (data) => {
		console.log("Message received:", data);
		io.emit("message", data);
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
