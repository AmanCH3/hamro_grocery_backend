import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { authenticateUser } from '../middleware/authorizedUser.js';

const router = express.Router();

// All routes are protected and require a logged-in user
router.get('/', authenticateUser, getNotifications);
router.put('/mark-read', authenticateUser, markAsRead);

export default router;