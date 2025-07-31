import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateUser, isAdmin } from '../middleware/authorizedUser.js';

const router = express.Router();

router.get('/stats', authenticateUser, isAdmin, getDashboardStats);

export default router;
