import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";

// Helper function to create user data payload
const createUserData = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    location: user.location,
    groceryPoints: user.groceryPoints,
});

// Register new user
export const registerUser = async (req, res) => {
    const { email, fullName, password } = req.body;
    if (!email || !fullName || !password) {
        return res.status(400).json({ success: false, message: "Please fill all fields." });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            fullName,
            password: hashedPassword,
            groceryPoints: 0,
        });
        await newUser.save();
        res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: createUserData(newUser),
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
};

// Login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.SECRET, { expiresIn: "1d" });
        res.status(200).json({
            success: true,
            token,
            data: createUserData(user),
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error during login." });
    }
};

// Send Password Reset Link
export const sendResetLink = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a reset link has been sent.",
            });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: "15m" });
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
        
        const mailOptions = {
            from: `'Hamro Grocery' <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Reset Your Hamro Grocery Password",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c5282;">Password Reset Request</h2>
                    <p>Hello ${user.fullName},</p>
                    <p>You requested a password reset. Please click the button below to create a new password. This link is valid for 15 minutes.</p>
                    <p style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </p>
                    <p>If you did not request this, please ignore this email. Your password will not be changed.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 0.8em; color: #777;">Hamro Grocery Team</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "If an account with that email exists, a reset link has been sent.",
        });

    } catch (err) {
        console.error("Forgot Password Error:", err); 
        res.status(500).json({
            success: false,
            message: "An error occurred while trying to send the reset email."
        });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const userId = decoded.id;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully.",
        });

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            console.error("JsonWebTokenError:", err.message);
            return res.status(401).json({ success: false, message: "Invalid or malformed token." });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token has expired. Please request a new reset link." });
        }
        console.error("Reset Password Error:", err);
        return res.status(500).json({ success: false, message: "An internal server error occurred." });
    }
};

// Get Profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching profile" });
    }
};

// Update Profile Info
export const updateUserProfile = async (req, res) => {
    const { fullName, email, location } = req.body || {};

    if (fullName === undefined && email === undefined && location === undefined) {
        return res.status(400).json({
            success: false,
            message: "No update information provided in request body.",
        });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.location = location !== undefined ? location : user.location;

        const updatedUser = await user.save();
        
        // --- NOTIFICATION LOGIC ---
        await new Notification({
            userId: user._id,
            message: 'Your profile has been updated successfully.'
        }).save();
        // --- END NOTIFICATION LOGIC ---

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: createUserData(updatedUser), 
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ success: false, message: "Server error while updating profile" });
    }
};

// Update Profile Picture
export const updateUserProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.profilePicture = `/images/profile-pictures/${req.file.filename}`;
        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully.",
            data: createUserData(updatedUser),
        });
    } catch (error) {
        console.error("Profile picture update error:", error);
        res.status(500).json({ success: false, message: "Server error during file update." });
    }
};