import express from 'express';
import { initiateEsewaPayment, verifyEsewaPayment } from '../controllers/paymentController.js';
import { authenticateUser } from '../middleware/authorizedUser.js';

const router = express.Router();

router.post('/initiate-esewa', authenticateUser, initiateEsewaPayment);
router.get('/esewa/verify', verifyEsewaPayment); 

export default router;