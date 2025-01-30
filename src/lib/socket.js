// import { Server } from "socket.io";
// import http from "http";
// import express from "express";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173"],
//   },
// });

// export function getReceiverSocketId(userId) {
//   return userSocketMap[userId];
// }

// const userSocketMap = {
//   // onlineUsers: new Map(),
//   // userSocketIds: new Map(),
//   // userRooms: new Map(),
//   // roomUsers: new Map(),
//   // roomMessages: new Map(),
//   // userRooms: new Map(),
//   // userTyping: new Map(),
// };

// io.on("connection", (socket) => {
//   console.log("a user connected", socket.id);

//   const userId = socket.handshake.query.userId;
//   if (userId) userSocketMap[userId] = socket.id;

//   io.emit("getOnlineUsers", Object.keys(userSocketMap));
//   socket.on("disconnect", () => {
//     console.log("user disconnected", socket.id);
//     delete userSocketMap[userId];
//     io.emit("getOnlineUsers", Object.keys(userSocketMap));
//   });
// });

// export { io, server, app };

import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  },
});

// Store both socket IDs and message status

const messageStatus = new Map();

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {
  // onlineUsers: new Map(),
  // userSocketIds: new Map(),
  // userRooms: new Map(),
  // roomUsers: new Map(),
  // roomMessages: new Map(),
  // userRooms: new Map(),
  // userTyping: new Map(),
};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle new message
  socket.on("sendMessage", async (messageData) => {
    const { receiverId, message } = messageData;
    console.log("receiverId", receiverId);
    console.log("message", message);
    const receiverSocketId = userSocketMap[receiverId];
    if (!receiverSocketId) {
      console.log(`Receiver with ID ${receiverId} is not connected`);
      return;
    }
    console.log("receiverSocketId", receiverSocketId);
    // Store initial message status
    if (message._id)
      messageStatus.set(message._id, {
        status: "sent",
        timestamp: new Date(),
      });

    // If receiver is online, emit message and update status to delivered
    if (receiverSocketId && message._id) {
      io.to(receiverSocketId).emit("newMessage", {
        ...message,
        status: "delivered",
      });

      messageStatus.set(message._id, {
        status: "delivered",
        timestamp: new Date(),
      });

      // Notify sender that message was delivered
      socket.emit("messageStatus", {
        messageId: message._id,
        status: "delivered",
        timestamp: new Date(),
      });
    }
  });

  // Handle message seen
  socket.on("messageRead", ({ messageId, senderId }) => {
    const senderSocketId = userSocketMap[senderId];

    messageStatus.set(messageId, {
      status: "seen",
      timestamp: new Date(),
    });

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatus", {
        messageId,
        status: "seen",
        timestamp: new Date(),
      });
    }
  });

  // Handle typing status
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", { userId });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };
