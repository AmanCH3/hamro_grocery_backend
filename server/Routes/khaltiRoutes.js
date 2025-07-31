import express from 'express';
import { initiateKhaltiPayment, verifyKhaltiPayment } from '../controllers/khalitController.js';
import { authenticateUser } from '../middleware/authorizedUser.js';

const router = express.Router();

router.post('/initiate', initiateKhaltiPayment);
router.post('/verify', verifyKhaltiPayment);

export default router;