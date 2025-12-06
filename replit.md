# داري الحنونة الأهلية - نظام إدارة ضيافة الأطفال

## Overview
This project is a production-ready Node.js + Express application for **Dari Al-Hanona Center** (داري الحنونة الأهلية لضيافة الأطفال), the largest licensed childcare center in Al-Ahsa, Saudi Arabia. The system provides comprehensive management capabilities including child care, attendance tracking, educational assessments, activity scheduling, staff management, and interactive reports with charts - all secured with modern authentication and role-based access control.

**Center Information:**
- **Location:** Al-Hofuf, Northern Salamaniya, Prince Fawaz bin Abdulaziz Street
- **Contact:** 0546425459
- **Age Range:** Infants to 6 years old
- **Operating Hours:** Morning until 1:30 PM
- **License:** Officially licensed by the Ministry of Human Resources and Social Development

**Center Staff (Real Data from Official Documents):**

**Management Team:**
- **مناير خالد سعد الزيد** - Center Director (Admin)
  - Email: manayer.alzaid@dari-alhanona.sa | Password: manayer2025
  - Responsibility: General supervision of all center activities and executive management
- **ندى عبدالرحمن المبيريك** - Admissions & Registration Manager (Admin)
  - Email: nada.almubairik@dari-alhanona.sa | Password: nada2025
  - Responsibility: Managing child admissions, registration, and daily internal supervision

**Educational Staff:**
- **صباح الطاهر** - NURSERY Teacher (Staff)
  - Email: sabah.altaher@dari-alhanona.sa | Password: sabah2025
  - Level: Infants and Advanced Nursery (0-3 years)
- **لطيفة السيف** - BRI KG Teacher (Staff)
  - Email: latifa.alsaif@dari-alhanona.sa | Password: latifa2025
  - Level: Pre-Kindergarten Preparatory (3-4 years)
- **إيمان النويصر** - KG1 Teacher (Staff)
  - Email: eman.alnuwiser@dari-alhanona.sa | Password: eman2025
  - Level: Kindergarten Level 1 (4-5 years)
- **مجد خالد** - KG2 Teacher (Staff)
  - Email: majd.khaled@dari-alhanona.sa | Password: majd2025
  - Level: Kindergarten Level 2 (5-6 years)
- **شهد الزيد** - KG3 Teacher (Staff)
  - Email: shahad.alzaid@dari-alhanona.sa | Password: shahad2025
  - Level: Pre-Primary/Preparatory (6+ years)

**Support Staff:**
- **وجدان الهويدي** - Cleaning Supervisor (Staff)
  - Email: wejdan.alhowidi@dari-alhanona.sa | Password: wejdan2025
  - Responsibility: Maintaining cleanliness and health of the educational environment

**Fee Structure (From Operations Manual):**
- Registration Fee: 990 SAR (one-time payment)
- Monthly Fee: 400 SAR
- Annual Fee: 750 SAR

## Recent Changes (October 27, 2025)

### **Production Readiness Improvements (Latest)**
- **Tailwind CSS Optimization**: Removed CDN and installed locally with PostCSS
  - Reduced CSS size from 3MB (CDN) to 20KB (minified build)
  - Added build scripts: `npm run build:css` and `npm run watch:css`
  - Created tailwind.config.js for optimized production builds
- **Deployment Configuration**: Set up Replit autoscale deployment config
  - Build command: `npm run build` (builds Tailwind CSS)
  - Run command: `npm start` (production mode)
  - Deployment target: autoscale (stateless, scalable)
- **UX Improvements**: Added autocomplete attributes to all form inputs
  - Email fields: `autocomplete="email"`
  - Password fields: `autocomplete="current-password"` and `autocomplete="new-password"`
  - Improved browser autofill experience
- **Production Mode Enhancements**:
  - Console.log disabled in production (non-localhost environments)
  - Production-ready error handling maintained
  - Performance optimizations for live deployment

### **Previous Updates**
- **Updated with Real Center Information**: Integrated actual data from center operations manual
  - Center name updated to "داري الحنونة الأهلية لضيافة الأطفال"
  - Added real location details (Al-Hofuf, Northern Salamaniya, Prince Fawaz Street)
  - Added contact information (0546425459)
  - Fee structure documented (990 SAR registration, 400 SAR monthly, 750 SAR annual)
  - Updated branding across all pages
- **Complete Staff Database from Official Documents**: 8 real staff members with working accounts
  - Management Team: مناير الزيد (Director), ندى المبيريك (Admissions Manager)
  - Educational Staff: صباح الطاهر (NURSERY), لطيفة السيف (BRI KG), إيمان النويصر (KG1), مجد خالد (KG2), شهد الزيد (KG3)
  - Support Staff: وجدان الهويدي (Cleaning Supervisor)
- **Enhanced Login Experience**: Interactive quick-access staff login buttons
  - Color-coded sections for Management (purple), Teachers (blue), Support (green)
  - One-click login - click any staff card to auto-fill credentials
  - All staff organized by role and level for easy access
- **Six Dashboard Cards Fully Functional**: All management interfaces now working:
  - Children Management (existing)
  - Attendance View - Full table view with 105 attendance records
  - Assessments View - Card-based layout with assessment details and ratings
  - Activities View - Organized activity cards with type badges and scheduling info
  - Staff Management (existing)
  - **Reports & Charts** - Interactive data visualization with Chart.js
- **Reports & Charts Feature**: Integrated Chart.js to display:
  - 4 statistics cards (total children, attendance today, assessments count, activities count)
  - Attendance trends over last 7 days (line chart)
  - Assessment types distribution (doughnut chart)
  - Activity types breakdown (bar chart)
  - Age distribution of children (pie chart)
  - **Mobile-Optimized Charts**: Responsive design for phones and tablets
    - Smaller font sizes (10px) on mobile devices
    - Legend repositioned to bottom on mobile (from top/right)
    - Reduced container height (200px) on mobile screens
    - Optimized for print (300px height with page-break-inside: avoid)
- **Navigation System**: Added "Back to Dashboard" buttons on all views with universal event handlers
- **Data Display**: Each view displays real data from the database with proper formatting and RTL support
- **Consistent Design**: All pages follow the same design language with gradient headers and responsive layouts
- **Cache Busting**: Version parameters (?v=1.7) added to JavaScript files for Safari/iPhone compatibility
- **Print Functionality**: Added print buttons and features to all major views
  - Reports & Charts page: Print full reports with statistics and charts
  - Attendance View: Print attendance records and daily logs
  - Children List: Print complete list of registered children
  - Professional print CSS with proper headers, logos, and date stamps
  - Automatic page formatting for A4 size with proper margins
  - Enhanced print instructions for iPhone/Safari users with step-by-step guidance

## User Preferences
None documented yet.

## System Architecture

### UI/UX Decisions
The system features a responsive design with a dashboard for key actions. It uses Arabic (RTL) for UI text and SVG icons for scalability. PWA readiness is included with a manifest and service worker. Dashboard now features 6 fully functional cards in a 2-3 column responsive grid. Each section has its own dedicated view page with consistent navigation patterns (back button and logout button in every header). Reports page includes 4 interactive charts using Chart.js library.

### Technical Implementations
- **Server**: Node.js (CommonJS) with Express.js (v4.18.2) as the web framework.
- **Database**: PostgreSQL, integrated via Neon, managed with Drizzle ORM.
- **Authentication**: JWT-based authentication with bcrypt for password hashing (10 salt rounds), httpOnly cookies, and localStorage. Includes role-based access control (admin, staff, parent).
- **Security**: Implemented using Helmet.js for various security headers (CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy) and `escapeHtml()` for XSS protection.
- **API Design**: Comprehensive RESTful API structure for all system operations, including public, protected (JWT required), and admin-specific (admin role required) endpoints.
- **File Upload**: Multer-based photo upload system for child profiles.
- **Error Handling & Monitoring**: Advanced error handling with comprehensive request and error logging.
- **Deployment**: Configured for Replit autoscale deployment, designed to be stateless.

### Feature Specifications
- **User Management**: Full CRUD operations for users (staff, parents, admins) with role assignment and deletion capabilities. Only admins can create and manage user roles. Includes dedicated UI page with user cards showing roles (color-coded badges), user info, and action buttons.
- **Children Management**: CRUD operations for child profiles, including photo uploads. Full table view with search functionality.
- **Attendance Tracking**: Record and view attendance for children. Includes dedicated view page with full table displaying child name, date, check-in/out times, and status badges (present/absent).
- **Assessment Management**: Create and list child assessments. Includes dedicated view page with card-based layout showing child ID, assessment type (color-coded badges for social/cognitive/physical/emotional), date, notes, and star ratings.
- **Activity Scheduling**: Create and list nursery activities. Includes dedicated view page with cards showing activity title, description, type (color-coded badges for educational/artistic/physical/recreational), date, duration, and instructor.
- **Dashboard**: Real-time statistics and 5 functional quick action buttons, each opening complete management interfaces.
- **Reporting**: System performance reports and diagnostic status pages.

### System Design Choices
- **Stateless Architecture**: Designed for scalability and easy deployment on platforms like Replit Autoscale.
- **Modular Structure**: Organized codebase with clear separation of concerns (server, shared, public folders).
- **Security-First Approach**: Embedded security features from the ground up, including secure defaults, role-based access, and input sanitization.

## External Dependencies

- **Database**: Neon PostgreSQL (via `@neondatabase/serverless`)
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Web Framework**: Express.js
- **Security Middleware**: Helmet.js
- **Environment Variables**: dotenv
- **Testing Tools**: autocannon (load testing), puppeteer (visual QA)
- **WebSocket Client**: ws (for Neon)