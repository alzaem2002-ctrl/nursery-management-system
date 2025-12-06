// Nursery Management API Routes
const express = require('express');
const { db } = require('../db');
const { children, attendance, assessments, activities, activityParticipants, users } = require('../../shared/schema');
const { eq, desc, and, gte, lte } = require('drizzle-orm');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all nursery routes
router.use(authenticateToken);

// ==================== Children Management (إدارة الأطفال) ====================

// Get all children
router.get('/children', async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.select().from(children);
    
    if (status) {
      query = query.where(eq(children.status, status));
    }
    
    const allChildren = await query.orderBy(desc(children.createdAt));
    res.json({ success: true, data: allChildren });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single child
router.get('/children/:id', async (req, res) => {
  try {
    const [child] = await db.select().from(children).where(eq(children.id, parseInt(req.params.id)));
    
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    
    res.json({ success: true, data: child });
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new child
router.post('/children', async (req, res) => {
  try {
    const [newChild] = await db.insert(children).values(req.body).returning();
    res.status(201).json({ success: true, data: newChild });
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update child
router.put('/children/:id', async (req, res) => {
  try {
    const [updatedChild] = await db
      .update(children)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(children.id, parseInt(req.params.id)))
      .returning();
    
    if (!updatedChild) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    
    res.json({ success: true, data: updatedChild });
  } catch (error) {
    console.error('Error updating child:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete child
router.delete('/children/:id', async (req, res) => {
  try {
    const [deletedChild] = await db
      .delete(children)
      .where(eq(children.id, parseInt(req.params.id)))
      .returning();
    
    if (!deletedChild) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    
    res.json({ success: true, message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Attendance Management (إدارة الحضور) ====================

// Get attendance records
router.get('/attendance', async (req, res) => {
  try {
    const { date, childId } = req.query;
    let query = db.select().from(attendance);
    
    if (date && childId) {
      query = query.where(and(eq(attendance.date, date), eq(attendance.childId, parseInt(childId))));
    } else if (date) {
      query = query.where(eq(attendance.date, date));
    } else if (childId) {
      query = query.where(eq(attendance.childId, parseInt(childId)));
    }
    
    const records = await query.orderBy(desc(attendance.date));
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record attendance
router.post('/attendance', async (req, res) => {
  try {
    const [record] = await db.insert(attendance).values(req.body).returning();
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update attendance
router.put('/attendance/:id', async (req, res) => {
  try {
    const [updated] = await db
      .update(attendance)
      .set(req.body)
      .where(eq(attendance.id, parseInt(req.params.id)))
      .returning();
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Assessments Management (إدارة التقييمات) ====================

// Get assessments
router.get('/assessments', async (req, res) => {
  try {
    const { childId, type } = req.query;
    let query = db.select().from(assessments);
    
    if (childId && type) {
      query = query.where(and(eq(assessments.childId, parseInt(childId)), eq(assessments.assessmentType, type)));
    } else if (childId) {
      query = query.where(eq(assessments.childId, parseInt(childId)));
    } else if (type) {
      query = query.where(eq(assessments.assessmentType, type));
    }
    
    const records = await query.orderBy(desc(assessments.assessmentDate));
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create assessment
router.post('/assessments', async (req, res) => {
  try {
    const [assessment] = await db.insert(assessments).values(req.body).returning();
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update assessment
router.put('/assessments/:id', async (req, res) => {
  try {
    const [updated] = await db
      .update(assessments)
      .set(req.body)
      .where(eq(assessments.id, parseInt(req.params.id)))
      .returning();
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Activities Management (إدارة الأنشطة) ====================

// Get activities
router.get('/activities', async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = db.select().from(activities);
    
    if (status && date) {
      query = query.where(and(eq(activities.status, status), eq(activities.date, date)));
    } else if (status) {
      query = query.where(eq(activities.status, status));
    } else if (date) {
      query = query.where(eq(activities.date, date));
    }
    
    const records = await query.orderBy(desc(activities.date));
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create activity
router.post('/activities', async (req, res) => {
  try {
    const [activity] = await db.insert(activities).values(req.body).returning();
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Statistics (الإحصائيات) ====================

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalChildren = await db.select().from(children).where(eq(children.status, 'active'));
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await db.select().from(attendance).where(eq(attendance.date, today));
    const recentAssessments = await db.select().from(assessments).orderBy(desc(assessments.assessmentDate)).limit(5);
    const upcomingActivities = await db.select().from(activities).where(eq(activities.status, 'scheduled')).limit(5);
    
    res.json({
      success: true,
      data: {
        totalChildren: totalChildren.length,
        presentToday: todayAttendance.filter(a => a.status === 'present').length,
        absentToday: todayAttendance.filter(a => a.status === 'absent').length,
        totalAttendanceToday: todayAttendance.length,
        recentAssessments,
        upcomingActivities,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
