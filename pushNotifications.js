const admin = require("firebase-admin");
const { Pool } = require("pg");

admin.initializeApp({
    credential: admin.credential.cert(require("./firebase-admin.json")), // Your Firebase Admin SDK JSON
});

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "dating_app",
    password: "yourpassword",
    port: 5432
});

// Function to send a push notification
const sendNotification = async (receiverId, message) => {
    const user = await pool.query("SELECT fcm_token FROM users WHERE id = $1", [receiverId]);
    if (!user.rows[0] || !user.rows[0].fcm_token) return;

    const messagePayload = {
        notification: { title: "New Message", body: message },
        token: user.rows[0].fcm_token,
    };

    admin.messaging().send(messagePayload)
        .then((response) => console.log("Notification sent:", response))
        .catch((error) => console.log("Error sending notification:", error));
};

module.exports = { sendNotification };