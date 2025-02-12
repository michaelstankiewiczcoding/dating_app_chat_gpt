const { sendNotification } = require("./pushNotifications");

socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, message } = data;

    await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, message, sent_at) VALUES ($1, $2, $3, NOW())",
        [senderId, receiverId, message]
    );

    if (usersOnline[receiverId]) {
        io.to(usersOnline[receiverId]).emit("receiveMessage", data);
    } else {
        sendNotification(receiverId, message);
    }
});