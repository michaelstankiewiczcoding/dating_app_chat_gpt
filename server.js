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