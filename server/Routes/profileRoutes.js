import express from 'express';
import multerUpload, { handleMulterError, getImageUrl, deleteOldProfilePicture } from './multer-config.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();



export default router; 