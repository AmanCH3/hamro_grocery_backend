import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authentication failed: No token provided." });
    }

    try {
        const token = authHeader.split(" ")[1];
        
        
        if (!process.env.SECRET) {
            throw new Error('JWT Secret is not defined. Cannot verify token.');
        }

        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findById(decoded._id).select("-password");

        if (!user) {
            return res.status(401).json({ success: false, message: "Authentication failed: User not found." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication Error:", err.message);
        return res.status(401).json({ success: false, message: `Authentication failed: ${err.message}. Please try logging in again.` });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied: Admin privileges are required." });
    }
};