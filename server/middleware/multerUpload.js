import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/images/profile-pictures';
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        // Ensure the fieldname matches what Flutter sends ('profilePicture')
        const filename = `profilePicture-${uniqueSuffix}${fileExtension}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Check if file type is allowed
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    }
};

const multerUpload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // Only allow 1 file
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer errors
export const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file is allowed.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${error.message}`
        });
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
};

// Helper function to get the full URL of uploaded image
export const getImageUrl = (filename) => {
    return `/images/profile-pictures/${filename}`;
};

// Helper function to delete old profile picture
export const deleteOldProfilePicture = (oldImagePath) => {
    if (oldImagePath && oldImagePath !== '/images/profile-pictures/default-profile.png') {
        const fullPath = path.join('public', oldImagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

export default multerUpload; 