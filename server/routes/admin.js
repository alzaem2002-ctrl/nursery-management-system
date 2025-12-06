// Admin-only Routes for User Management
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { users } = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Create new user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Validate input
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'يرجى إدخال جميع الحقول المطلوبة' 
      });
    }
    
    // Validate role
    if (!['admin', 'staff', 'parent'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'دور المستخدم غير صالح' 
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
    
    // Create user with admin-specified role
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role
    }).returning();
    
    // Remove password from response
    delete newUser.password;
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    
    // Remove passwords
    const usersWithoutPasswords = allUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({
      success: true,
      data: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'staff', 'parent'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'دور المستخدم غير صالح' 
      });
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, parseInt(req.params.id)))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'المستخدم غير موجود' 
      });
    }
    
    delete updatedUser.password;
    
    res.json({
      success: true,
      message: 'تم تحديث دور المستخدم بنجاح',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'لا يمكنك حذف حسابك الخاص' 
      });
    }
    
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, parseInt(req.params.id)))
      .returning();
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'المستخدم غير موجود' 
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
