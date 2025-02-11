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
