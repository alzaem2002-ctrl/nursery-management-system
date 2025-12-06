// Database Schema for Nursery Management System
// Using Drizzle ORM with Neon PostgreSQL

const { pgTable, serial, text, integer, timestamp, boolean, date } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Users table (للمستخدمين والموظفين)
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'), // admin, staff, parent
  createdAt: timestamp('created_at').defaultNow(),
});

// Children table (الأطفال)
const children = pgTable('children', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  parentName: text('parent_name').notNull(),
  parentPhone: text('parent_phone').notNull(),
  parentEmail: text('parent_email'),
  address: text('address'),
  medicalNotes: text('medical_notes'),
  allergies: text('allergies'),
  emergencyContact: text('emergency_contact'),
  photoUrl: text('photo_url'),
  status: text('status').notNull().default('active'), // active, inactive, graduated
  enrollmentDate: date('enrollment_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Attendance table (الحضور)
const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  childId: integer('child_id').notNull().references(() => children.id),
  date: date('date').notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  status: text('status').notNull().default('present'), // present, absent, late, excused
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Assessments table (التقييمات)
const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  childId: integer('child_id').notNull().references(() => children.id),
  assessmentType: text('assessment_type').notNull(), // physical, cognitive, social, emotional
  score: integer('score'),
  grade: text('grade'), // A, B, C, D, F
  observations: text('observations').notNull(),
  recommendations: text('recommendations'),
  assessedBy: integer('assessed_by').references(() => users.id),
  assessmentDate: date('assessment_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Activities table (الأنشطة)
const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  activityType: text('activity_type').notNull(), // educational, recreational, artistic, physical
  date: date('date').notNull(),
  duration: integer('duration'), // in minutes
  instructorId: integer('instructor_id').references(() => users.id),
  maxParticipants: integer('max_participants'),
  status: text('status').notNull().default('scheduled'), // scheduled, ongoing, completed, cancelled
  createdAt: timestamp('created_at').defaultNow(),
});

// Activity Participants (المشاركون في الأنشطة)
const activityParticipants = pgTable('activity_participants', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  childId: integer('child_id').notNull().references(() => children.id),
  participationStatus: text('participation_status').default('registered'), // registered, attended, absent
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
const childrenRelations = relations(children, ({ many }) => ({
  attendance: many(attendance),
  assessments: many(assessments),
  activityParticipants: many(activityParticipants),
}));

const attendanceRelations = relations(attendance, ({ one }) => ({
  child: one(children, {
    fields: [attendance.childId],
    references: [children.id],
  }),
  recordedByUser: one(users, {
    fields: [attendance.recordedBy],
    references: [users.id],
  }),
}));

const assessmentsRelations = relations(assessments, ({ one }) => ({
  child: one(children, {
    fields: [assessments.childId],
    references: [children.id],
  }),
  assessor: one(users, {
    fields: [assessments.assessedBy],
    references: [users.id],
  }),
}));

const activitiesRelations = relations(activities, ({ one, many }) => ({
  instructor: one(users, {
    fields: [activities.instructorId],
    references: [users.id],
  }),
  participants: many(activityParticipants),
}));

const activityParticipantsRelations = relations(activityParticipants, ({ one }) => ({
  activity: one(activities, {
    fields: [activityParticipants.activityId],
    references: [activities.id],
  }),
  child: one(children, {
    fields: [activityParticipants.childId],
    references: [children.id],
  }),
}));

module.exports = {
  users,
  children,
  attendance,
  assessments,
  activities,
  activityParticipants,
  childrenRelations,
  attendanceRelations,
  assessmentsRelations,
  activitiesRelations,
  activityParticipantsRelations,
};
