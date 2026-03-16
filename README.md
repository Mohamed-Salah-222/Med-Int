# Medical Interpreter Academy (MIA)

A production-grade Learning Management System for training and certifying medical interpreters. Features structured course progression, multi-tier assessments with anti-cheating measures, dual certificate generation with QR verification, AI-powered tutoring, and a comprehensive admin panel.

## Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS v4 · React Router DOM · Axios · Recharts · Lucide React

**Backend:** Express.js · TypeScript · MongoDB/Mongoose · JWT · Passport.js (Google OAuth 2.0) · bcryptjs · express-validator

**Services:** OpenAI GPT-4o-mini (AI Tutor) · node-canvas (Certificate Generation) · Cloudinary (Image Hosting) · qrcode (QR Codes) · Nodemailer (Email)

## Features

### Student Experience

- **Sequential Course Progression** : Chapters unlock after passing previous chapter tests. Lessons unlock sequentially within chapters. Chapter intros gate lesson access.
- **Multi-Tier Assessments** : Lesson quizzes (80% to pass, unlimited retries), chapter tests (20 random questions, 60s/question, 70% to pass, 3hr cooldown), final exam (100 questions, 60s/question, 80% to pass, 24hr cooldown).
- **Anti-Cheating** : Session-based test management with tab-switch detection (Visibility API), server-side session tracking, TTL auto-cleanup, and cooldown enforcement.
- **Dual Certificates** : Medical Interpreter + HIPAA Compliance certificates generated server-side with custom fonts, QR codes, and Cloudinary hosting.
- **AI Tutor** : Per-lesson chatbot powered by GPT-4o-mini with lesson content context and 15-message limit.
- **Glossary Tooltips** : Interactive term explanations on highlighted medical terminology in lesson content.

### Admin Panel

- **Full CRUD** : Courses, chapters, lessons (HTML content), question bank with assignment to quizzes/tests/exams.
- **User Management** : Pagination, search, role management (User/Student/Admin/SuperVisor), progress viewing, cooldown resets.
- **Analytics** : Recharts dashboards with daily activity (LineChart), pass rates (BarChart), question distribution (PieChart).
- **Platform Settings** : Maintenance mode, passing scores, cooldown hours, email config, certificate settings, system stats.

### Authentication

- Email/password with 6-digit email verification and password reset flow
- Google OAuth 2.0 via Passport.js
- JWT tokens with role-based access control
- Four roles: User → Student → Admin/SuperVisor

## Database (MongoDB - 12 Collections)

`User` · `Course` · `Chapter` · `Lesson` · `Question` · `UserProgress` · `TestSession` · `Certificate` · `Settings` · `ChatUsage` · `GlossaryTerm`

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google OAuth credentials
- OpenAI API key
- Cloudinary account

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_COURSE_ID=your_course_id
```

```bash
npm run dev
```

## Project Structure

```
frontend/src/
├── components/       # Layout, ProtectedRoute, GlossaryTooltip, LessonChatbot, LessonSidebar
├── context/          # AuthContext
├── pages/            # 30+ pages (Landing, Dashboard, LessonView, QuizView, Admin*, etc.)
├── services/         # Centralized Axios API layer
└── types/            # TypeScript interfaces

backend/src/
├── config/           # Passport.js, Cloudinary
├── controllers/      # auth, admin, course, access, chatbot, glossary
├── middleware/        # auth (JWT), role, maintenance
├── models/           # 12 Mongoose models
├── routes/           # 6 route files
├── services/         # Certificate generator (node-canvas)
├── utils/            # Email service, code generators
└── validators/       # express-validator chains
```

## License

Proprietary — All rights reserved.
