
3️⃣ Backend Setup for Your Tinder-Like Dating App

A robust backend is crucial for handling user authentication, real-time matching, chat, and data storage. Let’s break it down into:

1. Choosing the Tech Stack


2. Database Design


3. Authentication & User Management


4. Matching Algorithm


5. Chat & Notifications


6. Deployment




---

1️⃣ Choosing the Tech Stack

✔ Why Node.js? Fast, scalable, real-time support
✔ Why PostgreSQL? Structured data, easy relations (users, matches, chats)
✔ Why WebSockets? Instant updates for chat & notifications


---

2️⃣ Database Design

Entities & Relationships

1. Users Table (Stores user details)


2. Profiles Table (Interests, age, gender, etc.)


3. Matches Table (Stores who swiped right)


4. Messages Table (Stores chat history)



Database Schema (PostgreSQL)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    bio TEXT,
    interests TEXT[],
    location GEOMETRY(Point, 4326),  -- Geolocation for nearby matches
    profile_pictures TEXT[] -- Array of image URLs
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_1 INT REFERENCES users(id) ON DELETE CASCADE,
    user_2 INT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) CHECK (status IN ('pending', 'matched', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);

✔ Why Use Geolocation? Helps filter matches based on distance
✔ Why Store Images in URLs? Saves space; images are stored in AWS S3 or Firebase


---

3️⃣ Authentication & User Management

Using Firebase Authentication (Best for Simplicity)

Supports Google, Facebook, and Phone login.

Firebase handles security (avoids manual JWT implementation).


Or Using JWT for Custom Authentication

const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, "SECRET_KEY", { expiresIn: "7d" });
};

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, "SECRET_KEY");
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

✔ Why Firebase Auth? No need to manage passwords
✔ Why JWT? Custom authentication with session expiration


---

4️⃣ Matching Algorithm

Basic Matching Algorithm

1. Fetch users within X km radius.


2. Filter users by gender preference, age range, and interests.


3. If both users swipe right → Store in matches table.



SELECT * FROM profiles
WHERE ST_Distance(location, ST_GeomFromText('POINT(40.7128 -74.0060)', 4326)) < 5000
AND gender = 'female'
AND age BETWEEN 25 AND 30;

✔ Why PostgreSQL Geolocation? Optimized for distance-based search
✔ Why Store Matches in a Table? Keeps track of mutual likes


---

5️⃣ Real-Time Chat & Notifications

Using WebSockets (Socket.io) for Instant Messaging

const io = require("socket.io")(server, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", (data) => {
        io.to(data.receiverId).emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

✔ Why WebSockets? Real-time updates for chat & notifications


---

6️⃣ Deploying Your App

Backend Deployment Options

Database Hosting

PostgreSQL: Use Amazon RDS or Supabase

Storage: Firebase Storage or AWS S3 for profile images



---

💡 Next Steps

Do you need help setting up the backend step by step in Node.js or Django?

Would you like a working prototype for the swipe & matching system?








I'll now outline a full backend API for your Tinder-like dating app using Node.js (Express) and PostgreSQL. This will include:

✅ User Authentication (JWT)
✅ Profile Management (Upload & Edit Profile)
✅ Swipe System (Like, Dislike, Match Detection)
✅ Match & Chat System
✅ Real-Time WebSocket Chat


---

1️⃣ Setting Up the Backend

Install Dependencies

Make sure you have Node.js installed, then initialize a project:

mkdir dating-app-backend && cd dating-app-backend
npm init -y
npm install express pg bcrypt jsonwebtoken dotenv cors socket.io

express → API framework

pg → PostgreSQL driver

bcrypt → Password hashing

jsonwebtoken → Secure authentication

dotenv → Manage environment variables

cors → Enable frontend connections

socket.io → Real-time chat



---

2️⃣ Database Setup (PostgreSQL)

Create the tables for users, profiles, matches, and messages.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    bio TEXT,
    interests TEXT[],
    location GEOMETRY(Point, 4326), -- Geolocation for nearby matches
    profile_pictures TEXT[]
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_1 INT REFERENCES users(id) ON DELETE CASCADE,
    user_2 INT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) CHECK (status IN ('pending', 'matched', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);


---

3️⃣ Building the Express Backend

Setup Express Server (server.js)

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "dating_app",
    password: "yourpassword",
    port: 5432
});

const SECRET_KEY = "your_jwt_secret";

// Register User
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await pool.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hashedPassword]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        res.status(400).json({ error: "User already exists" });
    }
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(401).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: "7d" });
    res.json({ token });
});

// Middleware to Verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(403).json({ error: "Access denied" });

    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch {
        res.status(403).json({ error: "Invalid token" });
    }
};

// Get User Profile
app.get("/profile", verifyToken, async (req, res) => {
    const user = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
    res.json(user.rows[0]);
});

// Swipe API (Like or Dislike)
app.post("/swipe", verifyToken, async (req, res) => {
    const { swiped_user_id, action } = req.body;
    if (!["liked", "disliked"].includes(action)) return res.status(400).json({ error: "Invalid action" });

    await pool.query("INSERT INTO matches (user_1, user_2, status) VALUES ($1, $2, $3)", 
        [req.user.id, swiped_user_id, action]);

    // Check for mutual match
    const matchCheck = await pool.query(
        "SELECT * FROM matches WHERE user_1 = $1 AND user_2 = $2 AND status = 'liked'", 
        [swiped_user_id, req.user.id]);

    if (matchCheck.rows.length > 0) {
        await pool.query("UPDATE matches SET status = 'matched' WHERE user_1 = $1 AND user_2 = $2",
            [req.user.id, swiped_user_id]);
        await pool.query("UPDATE matches SET status = 'matched' WHERE user_1 = $1 AND user_2 = $2",
            [swiped_user_id, req.user.id]);

        return res.json({ message: "Match Found!" });
    }

    res.json({ message: `You swiped ${action}` });
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));


---

4️⃣ Real-Time Chat with WebSockets

Setup WebSocket for Chat (chat.js)

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


---

5️⃣ Running the Project

1️⃣ Start PostgreSQL and create the database:

psql -U postgres -c "CREATE DATABASE dating_app;"

2️⃣ Start the server:

node server.js

3️⃣ Start WebSocket chat:

node chat.js


---

6️⃣ API Endpoints


---

💡 Next Steps

✅ Deploy Backend to AWS / DigitalOcean
✅ Connect to React Native / Flutter Frontend
✅ Enhance AI-based Matching Algorithm

Would you like a React Native frontend to connect to this backend? 🚀





8️⃣ Real-Time Chat Integration for Your Dating App

To enable real-time messaging between matched users, we'll use Socket.io in the Node.js backend and React Native frontend.

✅ Features:

✔ Live Chat System (WebSockets)
✔ Message Storage (PostgreSQL)
✔ User Online Status
✔ Typing Indicator


---

1️⃣ Backend: WebSocket Setup (chat.js)

Install Socket.io if you haven't:

npm install socket.io

Create WebSocket Server

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


---

2️⃣ Frontend: Chat Screen (ChatScreen.js)

Install Socket.io client:

npm install socket.io-client

Create Chat Screen

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { io } from "socket.io-client";
import { getUserProfile } from "../services/api";

const socket = io("http://localhost:5001");

const ChatScreen = ({ route }) => {
    const { receiverId, receiverName } = route.params;
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState(null);
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const response = await getUserProfile("YOUR_AUTH_TOKEN");
            setUserId(response.data.id);
            socket.emit("userConnected", response.data.id);
        };
        fetchUser();

        socket.on("receiveMessage", (data) => {
            if (data.receiverId === userId) {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });

        socket.on("userTyping", (data) => {
            if (data.senderId === receiverId) {
                setTyping(true);
                setTimeout(() => setTyping(false), 1000);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [receiverId, userId]);

    const sendMessage = () => {
        if (message.trim() === "") return;

        const data = { senderId: userId, receiverId, message };
        socket.emit("sendMessage", data);
        setMessages([...messages, data]);
        setMessage("");
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Chat with {receiverName}</Text>
            
            <FlatList
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, alignSelf: item.senderId === userId ? "flex-end" : "flex-start", backgroundColor: item.senderId === userId ? "#DCF8C6" : "#E5E5EA", margin: 5, borderRadius: 10 }}>
                        <Text>{item.message}</Text>
                    </View>
                )}
            />

            {typing && <Text style={{ fontStyle: "italic" }}>Typing...</Text>}

            <TextInput
                value={message}
                onChangeText={(text) => {
                    setMessage(text);
                    socket.emit("typing", { senderId: userId, receiverId });
                }}
                placeholder="Type a message..."
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            <Button title="Send" onPress={sendMessage} />
        </View>
    );
};

export default ChatScreen;


---

3️⃣ Updating the Match List Screen

When a user matches with another, allow them to start a chat.

Match List (MatchListScreen.js)

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { getUserProfile } from "../services/api";

const MatchListScreen = ({ navigation }) => {
    const [matches, setMatches] = useState([]);
    const token = "YOUR_AUTH_TOKEN"; // Replace with stored token

    useEffect(() => {
        const fetchMatches = async () => {
            const response = await getUserProfile(token);
            setMatches(response.data.matches);
        };
        fetchMatches();
    }, []);

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Your Matches</Text>
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => navigation.navigate("Chat", { receiverId: item.id, receiverName: item.name })}>
                        <View style={{ padding: 10, backgroundColor: "#fff", marginVertical: 5, borderRadius: 10 }}>
                            <Text style={{ fontSize: 16 }}>{item.name}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

export default MatchListScreen;


---

4️⃣ Running the Chat System

Start Backend

node chat.js

Run React Native App

npx react-native run-android  # or run-ios for iOS


---

5️⃣ Features Implemented

✅ WebSocket Real-Time Chat
✅ Stores Messages in Database
✅ Typing Indicator
✅ User Online Status


---

💡 Next Steps

🚀 Enhance UI with Avatars & Message Read Status
🚀 Push Notifications for New Messages (Firebase)
🚀 Video Call Integration (WebRTC)

Would you like push notifications for new messages next? 🚀



9️⃣ Push Notifications for New Messages (React Native + Firebase)

Push notifications ensure users receive alerts for new messages, matches, and likes, even when the app is in the background.


---

1️⃣ Setup Firebase in React Native

Step 1: Create a Firebase Project

1. Go to Firebase Console.


2. Click "Create Project" → Enter a name → Continue.


3. Add an Android App / iOS App:

For Android: Add package name (from android/app/src/main/AndroidManifest.xml).

For iOS: Add the Bundle ID.



4. Download google-services.json (for Android) or GoogleService-Info.plist (for iOS).


5. Place it in:

android/app/google-services.json

ios/GoogleService-Info.plist



6. Enable Cloud Messaging under Firebase Project Settings → Cloud Messaging.




---

Step 2: Install Firebase Dependencies

Run:

npm install @react-native-firebase/app @react-native-firebase/messaging

For iOS:

cd ios
pod install


---

2️⃣ Backend: Sending Push Notifications

Install Firebase Admin SDK in Node.js Backend

Run:

npm install firebase-admin

Initialize Firebase in Backend (pushNotifications.js)

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

Trigger Push Notifications on New Messages

Modify chat.js WebSocket server:

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


---

3️⃣ Frontend: Requesting Push Notification Permissions

Modify App.js to request Firebase messaging permission.

import React, { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import { Alert } from "react-native";

const App = () => {
    useEffect(() => {
        const requestPermission = async () => {
            const authStatus = await messaging().requestPermission();
            if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
                console.log("Notification permission granted.");
            } else {
                console.log("Notification permission denied.");
            }
        };

        requestPermission();

        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
            Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
        });

        return unsubscribe;
    }, []);

    return <YourNavigationComponent />;
};

export default App;


---

4️⃣ Storing FCM Tokens for Each User

Modify Login API (server.js) to store user’s Firebase Cloud Messaging (FCM) token.

app.post("/login", async (req, res) => {
    const { email, password, fcm_token } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) return res.status(401).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    await pool.query("UPDATE users SET fcm_token = $1 WHERE id = $2", [fcm_token, user.rows[0].id]);

    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: "7d" });
    res.json({ token });
});


---

5️⃣ Sending the FCM Token from React Native

Modify Login Screen (LoginScreen.js) to send the FCM token.

import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { loginUser } from "../services/api";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fcmToken, setFcmToken] = useState("");

    useEffect(() => {
        const getToken = async () => {
            const token = await messaging().getToken();
            setFcmToken(token);
        };
        getToken();
    }, []);

    const handleLogin = async () => {
        try {
            const response = await loginUser(email, password, fcmToken);
            Alert.alert("Success", "Login Successful");
            navigation.navigate("Home");
        } catch (error) {
            Alert.alert("Error", "Invalid credentials");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />
            <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 10 }} />
            <Button title="Login" onPress={handleLogin} />
        </View>
    );
};

export default LoginScreen;


---

6️⃣ Testing Push Notifications

Step 1: Start Backend

node server.js
node chat.js

Step 2: Run React Native App

npx react-native run-android  # or run-ios for iOS

Step 3: Send a Test Push Notification

Manually send a push notification using Firebase:

curl -X POST "https://fcm.googleapis.com/fcm/send" \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "New Message",
      "body": "You have a new message"
    }
  }'


---

🎯 Features Implemented

✅ Push Notifications for New Messages
✅ Stores FCM Token for Users
✅ Handles Notifications in Background & Foreground
✅ Supports Firebase Cloud Messaging


---

🚀 Next Steps

✨ Push Notifications for New Matches & Likes
✨ Integrate Video & Voice Call (WebRTC)
✨ Deploy App to Play Store / App Store

Would you like video call integration (WebRTC) next? 🎥










🔟 Video Call Integration (WebRTC + React Native + Node.js)

To enable live video calling between matched users, we’ll use WebRTC (Web Real-Time Communication), which allows peer-to-peer video/audio streaming.

✅ Features:

✔ Real-time Video & Audio Call
✔ WebRTC Integration
✔ Signaling Server using Socket.io
✔ ICE (Interactive Connectivity Establishment) Servers for Connection
✔ React Native UI for Calls


---

1️⃣ Install Dependencies

First, install the necessary WebRTC and Socket.io packages in React Native:

npm install react-native-webrtc socket.io-client


---

2️⃣ Backend: WebRTC Signaling Server

The signaling server helps in establishing WebRTC connections between users.

Install Dependencies

npm install express socket.io cors

Create signalingServer.js

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


---

3️⃣ React Native: Video Call UI

Create a new screen for the Video Call Interface.

Create VideoCallScreen.js

import React, { useEffect, useRef, useState } from "react";
import { View, Button, Text } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const VideoCallScreen = ({ route }) => {
    const { roomId } = route.params;
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnection = useRef(new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    })).current;

    useEffect(() => {
        startLocalStream();
        socket.emit("joinCall", roomId);

        socket.on("userJoined", async (peerId) => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
            socket.emit("offer", { target: peerId, sdp: offer, sender: socket.id });
        });

        socket.on("offer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
            socket.emit("answer", { target: data.sender, sdp: answer, sender: socket.id });
        });

        socket.on("answer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        });

        socket.on("iceCandidate", async (data) => {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        });

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { target: roomId, candidate: event.candidate, sender: socket.id });
            }
        };

        return () => {
            peerConnection.close();
            socket.disconnect();
        };
    }, []);

    const startLocalStream = async () => {
        const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {localStream && <RTCView streamURL={localStream.toURL()} style={{ width: "100%", height: 300 }} />}
            {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={{ width: "100%", height: 300 }} />}
            <Button title="End Call" onPress={() => socket.disconnect()} />
        </View>
    );
};

export default VideoCallScreen;


---

4️⃣ Call Button in Match List

Modify MatchListScreen.js to include a Video Call Button.

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Button } from "react-native";
import { getUserProfile } from "../services/api";

const MatchListScreen = ({ navigation }) => {
    const [matches, setMatches] = useState([]);
    const token = "YOUR_AUTH_TOKEN"; // Replace with stored token

    useEffect(() => {
        const fetchMatches = async () => {
            const response = await getUserProfile(token);
            setMatches(response.data.matches);
        };
        fetchMatches();
    }, []);

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Your Matches</Text>
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, backgroundColor: "#fff", marginVertical: 5, borderRadius: 10 }}>
                        <Text style={{ fontSize: 16 }}>{item.name}</Text>
                        <Button title="Start Video Call" onPress={() => navigation.navigate("VideoCall", { roomId: item.id })} />
                    </View>
                )}
            />
        </View>
    );
};

export default MatchListScreen;


---

5️⃣ Running the Video Call System

Step 1: Start the WebRTC Signaling Server

node signalingServer.js

Step 2: Run React Native App

npx react-native run-android  # or run-ios for iOS

Step 3: Start a Call

1. Match with a user.


2. Click "Start Video Call".


3. The other user should join the same room for the call to start.




---

🎯 Features Implemented

✅ WebRTC for Video Calls
✅ Real-Time Signaling using Socket.io
✅ Peer-to-Peer Video & Audio Communication
✅ Integrated into Match System


---

🚀 Next Steps

✨ Enhance UI (Call Accept/Reject UI, Camera Flip, Mute)
✨ Add End-to-End Encryption for Secure Calls
✨ Deploy to Production (AWS, Firebase)

Would you like call accept/reject UI next? 📞🚀





📞 Call Accept/Reject UI for Video Calling

To improve the user experience, we will add: ✅ Incoming Call Screen with Accept & Reject Buttons
✅ Real-Time Call Notifications using Socket.io
✅ Improved UI for Active Calls (Mute, End Call, Camera Flip)


---

1️⃣ Backend: Notify Users of Incoming Calls

Modify signalingServer.js to send call notifications.

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let usersOnline = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("userOnline", (userId) => {
        usersOnline[userId] = socket.id;
        console.log(`User ${userId} is online`);
    });

    socket.on("callUser", (data) => {
        const { callerId, receiverId, roomId } = data;
        if (usersOnline[receiverId]) {
            io.to(usersOnline[receiverId]).emit("incomingCall", { callerId, roomId });
        }
    });

    socket.on("answerCall", (data) => {
        io.to(usersOnline[data.callerId]).emit("callAnswered", { roomId: data.roomId, accepted: data.accepted });
    });

    socket.on("disconnect", () => {
        Object.keys(usersOnline).forEach((key) => {
            if (usersOnline[key] === socket.id) delete usersOnline[key];
        });
        console.log("User disconnected:", socket.id);
    });
});

server.listen(5002, () => {
    console.log("WebRTC Signaling Server running on port 5002");
});


---

2️⃣ React Native: Incoming Call UI

Create a new screen IncomingCallScreen.js.

import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const IncomingCallScreen = ({ navigation }) => {
    const [callerId, setCallerId] = useState(null);
    const [roomId, setRoomId] = useState(null);

    useEffect(() => {
        socket.on("incomingCall", (data) => {
            setCallerId(data.callerId);
            setRoomId(data.roomId);
            Alert.alert("Incoming Call", `User ${data.callerId} is calling you.`);
        });

        return () => socket.off("incomingCall");
    }, []);

    const acceptCall = () => {
        socket.emit("answerCall", { callerId, roomId, accepted: true });
        navigation.navigate("VideoCall", { roomId });
    };

    const rejectCall = () => {
        socket.emit("answerCall", { callerId, roomId, accepted: false });
        setCallerId(null);
        setRoomId(null);
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {callerId ? (
                <>
                    <Text>User {callerId} is calling...</Text>
                    <Button title="Accept" onPress={acceptCall} />
                    <Button title="Reject" onPress={rejectCall} />
                </>
            ) : (
                <Text>Waiting for calls...</Text>
            )}
        </View>
    );
};

export default IncomingCallScreen;


---

3️⃣ Outgoing Call Button

Modify MatchListScreen.js to allow calling users.

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Button, Alert } from "react-native";
import { io } from "socket.io-client";
import { getUserProfile } from "../services/api";

const socket = io("http://localhost:5002");

const MatchListScreen = ({ navigation }) => {
    const [matches, setMatches] = useState([]);
    const token = "YOUR_AUTH_TOKEN"; // Replace with stored token

    useEffect(() => {
        const fetchMatches = async () => {
            const response = await getUserProfile(token);
            setMatches(response.data.matches);
        };
        fetchMatches();
    }, []);

    const callUser = (receiverId) => {
        const roomId = `${receiverId}_${Date.now()}`;
        socket.emit("callUser", { callerId: "YOUR_USER_ID", receiverId, roomId });
        navigation.navigate("VideoCall", { roomId });
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Your Matches</Text>
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, backgroundColor: "#fff", marginVertical: 5, borderRadius: 10 }}>
                        <Text style={{ fontSize: 16 }}>{item.name}</Text>
                        <Button title="Start Video Call" onPress={() => callUser(item.id)} />
                    </View>
                )}
            />
        </View>
    );
};

export default MatchListScreen;


---

4️⃣ Update VideoCallScreen.js to Handle Call Acceptance

Modify VideoCallScreen to start the call only when accepted.

import React, { useEffect, useRef, useState } from "react";
import { View, Button, Text, Alert } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const VideoCallScreen = ({ route, navigation }) => {
    const { roomId } = route.params;
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnection = useRef(new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    })).current;

    useEffect(() => {
        startLocalStream();
        socket.emit("joinCall", roomId);

        socket.on("callAnswered", (data) => {
            if (!data.accepted) {
                Alert.alert("Call Rejected", "The other user rejected the call.");
                navigation.goBack();
            }
        });

        socket.on("offer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
            socket.emit("answer", { target: data.sender, sdp: answer, sender: socket.id });
        });

        socket.on("answer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        });

        socket.on("iceCandidate", async (data) => {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        });

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { target: roomId, candidate: event.candidate, sender: socket.id });
            }
        };

        return () => {
            peerConnection.close();
            socket.disconnect();
        };
    }, []);

    const startLocalStream = async () => {
        const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {localStream && <RTCView streamURL={localStream.toURL()} style={{ width: "100%", height: 300 }} />}
            {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={{ width: "100%", height: 300 }} />}
            <Button title="End Call" onPress={() => socket.disconnect()} />
        </View>
    );
};

export default VideoCallScreen;


---

✅ Features Implemented

✔ Incoming Call Screen (Accept/Reject)
✔ Real-time Call Notifications using WebSockets
✔ Updated Video Call Logic (Handles Rejection)


---

🚀 Next Steps

✨ Mute/Unmute, Flip Camera, Speaker Toggle
✨ End-to-End Encryption for Secure Calls
✨ Deploy to Play Store / App Store

Would you like mute/unmute & camera flip controls next? 🎥📲





🎨 Color-Coded UI for Video Calls

To improve the user experience, we will: ✅ Add color-coded buttons for different actions
✅ Use color indicators for call status (Connected, Disconnected, Muted, etc.)
✅ Improve UI with a professional color scheme


---

1️⃣ Updated Color Scheme

We'll follow a modern and intuitive color scheme:


---

2️⃣ Updated VideoCallScreen.js with Color-Coded UI

import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const VideoCallScreen = ({ route, navigation }) => {
    const { roomId } = route.params;
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    const peerConnection = useRef(new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    })).current;

    useEffect(() => {
        startLocalStream();
        socket.emit("joinCall", roomId);

        socket.on("offer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
            socket.emit("answer", { target: data.sender, sdp: answer, sender: socket.id });
        });

        socket.on("answer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        });

        socket.on("iceCandidate", async (data) => {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        });

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { target: roomId, candidate: event.candidate, sender: socket.id });
            }
        };

        return () => {
            peerConnection.close();
            socket.disconnect();
        };
    }, []);

    const startLocalStream = async () => {
        const stream = await mediaDevices.getUserMedia({ 
            video: { facingMode: isFrontCamera ? "user" : "environment" }, 
            audio: true 
        });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    };

    const toggleMute = () => {
        localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
        setIsVideoEnabled(!isVideoEnabled);
    };

    const flipCamera = async () => {
        setIsFrontCamera(!isFrontCamera);
        const newStream = await mediaDevices.getUserMedia({
            video: { facingMode: isFrontCamera ? "environment" : "user" },
            audio: true
        });

        // Replace video track in the peer connection
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);

        setLocalStream(newStream);
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
            {localStream && <RTCView streamURL={localStream.toURL()} style={{ width: "100%", height: 300, borderRadius: 10, borderWidth: 2, borderColor: "#fff" }} />}
            {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={{ width: "100%", height: 300, borderRadius: 10, borderWidth: 2, borderColor: "#fff", marginTop: 10 }} />}

            {/* Video Call Controls */}
            <View style={{ flexDirection: "row", marginTop: 20 }}>
                {/* Mute/Unmute Button */}
                <TouchableOpacity onPress={toggleMute} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: isMuted ? "red" : "green" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>{isMuted ? "Unmute" : "Mute"}</Text>
                </TouchableOpacity>

                {/* Video On/Off Button */}
                <TouchableOpacity onPress={toggleVideo} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: isVideoEnabled ? "blue" : "gray" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>{isVideoEnabled ? "Turn Off Video" : "Turn On Video"}</Text>
                </TouchableOpacity>

                {/* Flip Camera Button */}
                <TouchableOpacity onPress={flipCamera} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: "purple" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>Flip Camera</Text>
                </TouchableOpacity>

                {/* End Call Button */}
                <TouchableOpacity onPress={() => socket.disconnect()} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: "black" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>End Call</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default VideoCallScreen;


---

3️⃣ Running the Video Call System with Color-Coded UI

Step 1: Start the WebRTC Signaling Server

node signalingServer.js

Step 2: Run React Native App

npx react-native run-android  # or run-ios for iOS

Step 3: Start a Call

1. Match with a user.


2. Click "Start Video Call".


3. Use the new color-coded buttons for mute, video toggle, camera flip, and call end.




---

🎯 Features Implemented

✅ Mute Button (Red/Green for Muted/Unmuted)
✅ Video Toggle (Gray/Blue for Off/On)
✅ Camera Flip Button (Purple)
✅ End Call Button (Black)
✅ Updated UI with Borders & Dark Mode Background


---

🚀 Next Steps

✨ Add Animated Button Effects for Better UX
✨ Implement Call Timer and Duration Display
✨ Introduce In-Call Chat Feature (Message While Calling)

Would you like animated buttons & transitions next? 🚀🎨

