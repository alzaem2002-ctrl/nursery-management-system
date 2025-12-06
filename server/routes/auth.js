// Authentication Routes for Nursery Management System
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

const router = express.Router();

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Register new user (staff only - admins must be created by existing admins)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'يرجى إدخال جميع الحقول المطلوبة' 
      });
    }
    
    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'البريد الإلكتروني مستخدم بالفعل' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // SECURITY: Always create new users as 'staff' (not admin)
    // Only existing admins can create other admins via admin panel
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'staff' // Fixed role - cannot be overridden
    }).returning();
    
    // Remove password from response
    delete newUser.password;
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح',
      data: { user: newUser, token }
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
      });
    }
    
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'بيانات الدخول غير صحيحة' 
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'بيانات الدخول غير صحيحة' 
      });
    }
    
    // Remove password from response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user (requires authentication)
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'غير مصرح - يرجى تسجيل الدخول' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.id));
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'المستخدم غير موجود' 
      });
    }
    
    // Remove password
    delete user.password;
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'رمز التحقق غير صالح' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى' 
      });
    }
    console.error('Error in /me:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout (client-side token removal, but we can blacklist if needed)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

module.exports = router;
