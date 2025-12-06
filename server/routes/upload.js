// File Upload Routes for Nursery Management System
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/children');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: childId_timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `child_${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('الصور فقط مسموحة (JPEG, PNG, GIF, WEBP)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Apply authentication to all upload routes
router.use(authenticateToken);

// Upload child photo
router.post('/child-photo', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم رفع أي صورة'
      });
    }
    
    const photoUrl = `/uploads/children/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: {
        filename: req.file.filename,
        photoUrl: photoUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete child photo
router.delete('/child-photo/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../public/uploads/children', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'تم حذف الصورة بنجاح'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'الصورة غير موجودة'
      });
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
