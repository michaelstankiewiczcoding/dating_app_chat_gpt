const { Server } = require("socket.io");
const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "dating_app",
    password: "yourpassword",
    port: 5432
});

const io = new Server(5001, { cors: { origin: "*" } });

let usersOnline = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("userConnected", (userId) => {
        usersOnline[userId] = socket.id;
        io.emit("updateOnlineUsers", Object.keys(usersOnline));
    });

    socket.on("sendMessage", async (data) => {
        const { senderId, receiverId, message } = data;

        await pool.query(
            "INSERT INTO messages (sender_id, receiver_id, message, sent_at) VALUES ($1, $2, $3, NOW())",
            [senderId, receiverId, message]
        );

        if (usersOnline[receiverId]) {
            io.to(usersOnline[receiverId]).emit("receiveMessage", data);
        }
    });

    socket.on("typing", (data) => {
        if (usersOnline[data.receiverId]) {
            io.to(usersOnline[data.receiverId]).emit("userTyping", { senderId: data.senderId });
        }
    });

    socket.on("disconnect", () => {
        Object.keys(usersOnline).forEach((key) => {
            if (usersOnline[key] === socket.id) delete usersOnline[key];
        });
        io.emit("updateOnlineUsers", Object.keys(usersOnline));
        console.log("User disconnected:", socket.id);
    });
});

io.listen(5001);