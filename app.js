require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const connectdb = require("./config/db");
const { notFound, globalErrorHandler } = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 5000;

connectdb();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://full-stack-tfm-next.vercel.app",
    ],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(globalErrorHandler);


const onlineUsers = new Map();
io.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    socket.join(userId);
  });

  socket.on("typing", (data) => {
    const { senderId, senderName, recipientId, isTyping } = data;
    socket.to(recipientId).emit("typing", { senderId, senderName, isTyping });
  });

  socket.on("privateMessage", (message) => {
    socket.to(message.recipientId).emit("privateMessage", message);
  });

  socket.on("messageSeen", ({ senderId }) => {
    socket.to(senderId).emit("messageSeen");
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

app.set("io", io);

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
