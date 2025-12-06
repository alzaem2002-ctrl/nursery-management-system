// Seed data for Nursery Management System
const { db } = require('./db');
const { users, children, attendance, assessments, activities } = require('../shared/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 جاري إضافة البيانات التجريبية...');
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@nursery.com'));
    
    let admin;
    if (existingAdmin.length > 0) {
      console.log('ℹ️  مستخدم المدير موجود بالفعل');
      admin = existingAdmin[0];
    } else {
      // Create admin user with hashed password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      [admin] = await db.insert(users).values({
        email: 'admin@nursery.com',
        password: hashedPassword,
        name: 'مدير النظام',
        role: 'admin'
      }).returning();
      console.log('✅ تم إنشاء مستخدم المدير');
    }
    
    // Check existing children count
    const existingChildren = await db.select().from(children);
    
    if (existingChildren.length > 0) {
      console.log(`ℹ️  توجد ${existingChildren.length} سجلات أطفال بالفعل`);
      return;
    }
    
    // Create sample children
    const childrenData = [
      {
        name: 'محمد أحمد',
        age: 4,
        dateOfBirth: '2020-05-15',
        parentName: 'أحمد محمود',
        parentPhone: '0501234567',
        parentEmail: 'ahmed@example.com',
        address: 'الرياض، حي النرجس',
        medicalNotes: 'لا توجد ملاحظات طبية',
        allergies: 'لا توجد حساسية',
        emergencyContact: '0509876543',
        status: 'active',
        enrollmentDate: '2024-01-15'
      },
      {
        name: 'فاطمة خالد',
        age: 3,
        dateOfBirth: '2021-08-20',
        parentName: 'خالد عبدالله',
        parentPhone: '0551234567',
        parentEmail: 'khalid@example.com',
        address: 'جدة، حي الزهراء',
        medicalNotes: 'حساسية خفيفة من الغبار',
        allergies: 'الفول السوداني',
        emergencyContact: '0559876543',
        status: 'active',
        enrollmentDate: '2024-02-01'
      },
      {
        name: 'عمر سعيد',
        age: 5,
        dateOfBirth: '2019-12-10',
        parentName: 'سعيد علي',
        parentPhone: '0531234567',
        parentEmail: 'saeed@example.com',
        address: 'الدمام، حي الفيصلية',
        medicalNotes: 'يرتدي نظارات طبية',
        allergies: 'لا توجد',
        emergencyContact: '0539876543',
        status: 'active',
        enrollmentDate: '2023-09-01'
      },
      {
        name: 'نورة عبدالرحمن',
        age: 4,
        dateOfBirth: '2020-03-25',
        parentName: 'عبدالرحمن محمد',
        parentPhone: '0561234567',
        parentEmail: 'nora@example.com',
        address: 'مكة، حي العزيزية',
        medicalNotes: 'لا توجد',
        allergies: 'البيض',
        emergencyContact: '0569876543',
        status: 'active',
        enrollmentDate: '2024-03-15'
      },
      {
        name: 'يوسف ماجد',
        age: 3,
        dateOfBirth: '2021-11-05',
        parentName: 'ماجد يوسف',
        parentPhone: '0541234567',
        parentEmail: 'majed@example.com',
        address: 'الرياض، حي الملقا',
        medicalNotes: 'ربو خفيف',
        allergies: 'العسل',
        emergencyContact: '0549876543',
        status: 'active',
        enrollmentDate: '2024-04-01'
      }
    ];
    
    const insertedChildren = await db.insert(children).values(childrenData).returning();
    console.log(`✅ تم إضافة ${insertedChildren.length} أطفال`);
    
    // Add today's attendance for all children
    const today = new Date().toISOString().split('T')[0];
    const attendanceData = insertedChildren.map((child, index) => ({
      childId: child.id,
      date: today,
      checkInTime: new Date(`${today}T08:${String(index * 10).padStart(2, '0')}:00`),
      status: index < 4 ? 'present' : 'absent',
      notes: index < 4 ? 'حضور منتظم' : 'غياب بعذر',
      recordedBy: admin.id
    }));
    
    await db.insert(attendance).values(attendanceData);
    console.log('✅ تم تسجيل حضور اليوم');
    
    // Add sample assessments
    const assessmentData = insertedChildren.slice(0, 3).map((child) => ({
      childId: child.id,
      assessmentType: 'cognitive',
      score: Math.floor(Math.random() * 30) + 70,
      grade: 'A',
      observations: 'تطور ممتاز في المهارات المعرفية',
      recommendations: 'الاستمرار في الأنشطة التعليمية المتنوعة',
      assessedBy: admin.id,
      assessmentDate: today
    }));
    
    await db.insert(assessments).values(assessmentData);
    console.log('✅ تم إضافة التقييمات');
    
    // Add sample activities
    const activitiesData = [
      {
        title: 'نشاط الرسم والتلوين',
        description: 'نشاط فني يطور المهارات الحركية الدقيقة',
        activityType: 'artistic',
        date: today,
        duration: 60,
        instructorId: admin.id,
        maxParticipants: 15,
        status: 'scheduled'
      },
      {
        title: 'رياضة اللعب الحر',
        description: 'نشاط بدني في الهواء الطلق',
        activityType: 'physical',
        date: today,
        duration: 45,
        instructorId: admin.id,
        maxParticipants: 20,
        status: 'scheduled'
      },
      {
        title: 'قصة اليوم',
        description: 'قراءة قصة تعليمية ممتعة',
        activityType: 'educational',
        date: today,
        duration: 30,
        instructorId: admin.id,
        maxParticipants: 25,
        status: 'completed'
      }
    ];
    
    await db.insert(activities).values(activitiesData);
    console.log('✅ تم إضافة الأنشطة');
    
    console.log('\n🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
    console.log('📊 الإحصائيات:');
    console.log(`   - ${insertedChildren.length} أطفال`);
    console.log(`   - ${attendanceData.length} سجل حضور`);
    console.log(`   - ${assessmentData.length} تقييمات`);
    console.log(`   - ${activitiesData.length} أنشطة`);
    
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ اكتمل!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { seed };
