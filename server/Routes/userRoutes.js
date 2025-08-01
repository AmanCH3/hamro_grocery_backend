import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfilePicture, updateUserProfile,sendResetLink,resetPassword } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authorizedUser.js';
import multerUpload, { handleMulterError, getImageUrl, deleteOldProfilePicture } from '../middleware/multerUpload.js';


const router = express.Router();

// --- PUBLIC ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);
// --- PROTECTED ROUTES ---
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);

// router.put(
//     '/profile/picture',
//     authenticateUser,
//     multerUpload.single('profilePicture'),
//     updateUserProfilePicture
// );

// Profile picture upload route
router.put('/profile/picture', 
    multerUpload.single('profilePicture'), // 'profilePicture' must match the field name in Flutter FormData
    handleMulterError,
    async (req, res) => {
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Get user from authentication middleware (assuming you have auth middleware)
            // const userId = req.user._id; // Adjust based on your auth setup

            // Get the uploaded file information
            const uploadedFile = req.file;
            const imageUrl = getImageUrl(uploadedFile.filename);

            // Here you would typically:
            // 1. Get the user's current profile picture path
            // 2. Update the user's profile in the database with the new image path
            // 3. Delete the old profile picture if it exists

            // Example database update (adjust based on your database setup)
            // const user = await User.findById(userId);
            // const oldImagePath = user.profilePicture;
            // user.profilePicture = imageUrl;
            // await user.save();
            // deleteOldProfilePicture(oldImagePath);

            // For now, just return success response
            res.json({
                success: true,
                message: 'Profile picture updated successfully',
                data: {
                    profilePicture: imageUrl,
                    filename: uploadedFile.filename
                }
            });

        } catch (error) {
            console.error('Profile picture upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// Get profile picture route (optional)
router.get('/profile/picture/:filename', (req, res) => {
    const { filename } = req.params;
    const imagePath = path.join('public/images/profile-pictures', filename);
    
    if (fs.existsSync(imagePath)) {
        res.sendFile(path.resolve(imagePath));
    } else {
        res.status(404).json({
            success: false,
            message: 'Image not found'
        });
    }
});
router.post(
    "/forgot-password",
    sendResetLink
);
router.post(
    "/reset-password/:token",
    resetPassword
);

export default router;


