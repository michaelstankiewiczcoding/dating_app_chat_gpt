const { Server } = require("socket.io");
const io = new Server(5001, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", (data) => {
        io.to(data.receiverId).emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});