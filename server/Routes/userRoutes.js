import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfilePicture, updateUserProfile,sendResetLink,resetPassword } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authorizedUser.js';
import multerUpload from '../middleware/multerUpload.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);
// --- PROTECTED ROUTES ---
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);

router.put(
    '/profile/picture',
    authenticateUser,
    multerUpload.single('profilePicture'),
    updateUserProfilePicture
);
router.post(
    "/forgot-password",
    sendResetLink
);
router.post(
    "/reset-password/:token",
    resetPassword
);

export default router;