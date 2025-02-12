const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinCall", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
        socket.to(room).emit("userJoined", socket.id);
    });

    socket.on("offer", (data) => {
        socket.to(data.target).emit("offer", { sdp: data.sdp, sender: data.sender });
    });

    socket.on("answer", (data) => {
        socket.to(data.target).emit("answer", { sdp: data.sdp, sender: data.sender });
    });

    socket.on("iceCandidate", (data) => {
        socket.to(data.target).emit("iceCandidate", { candidate: data.candidate, sender: data.sender });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(5002, () => {
    console.log("WebRTC Signaling Server running on port 5002");
});