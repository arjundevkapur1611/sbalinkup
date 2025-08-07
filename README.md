# SBA LinkUp - Sports Business Networking Platform

A modern networking platform connecting sports business students with industry professionals.

## 🚀 Features

- **User Authentication** - Secure login/registration for students, professionals, and admins
- **Profile Management** - Comprehensive user profiles with skills, experience, and interests
- **Job Board** - Post and apply for internships, full-time positions, and volunteer opportunities
- **Smart Matching** - AI-powered matching between students and job opportunities
- **Real-time Messaging** - Direct communication between users
- **Interview Scheduling** - Built-in calendar system for scheduling interviews
- **Resume Upload** - Students can upload and manage their resumes
- **Admin Dashboard** - Complete platform management and analytics

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: PostgreSQL (Neon recommended)
- **Authentication**: JWT + bcryptjs
- **File Upload**: AWS S3 compatible
- **Email**: Nodemailer
- **API**: Next.js API Routes

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sba-linkup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/sba_linkup"
   
   # JWT Secret
   JWT_SECRET="your-jwt-secret-key"
   
   # File Upload (AWS S3 or compatible)
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_BUCKET_NAME="sba-linkup-uploads"
   AWS_REGION="us-east-1"
   
   # Email Service
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   FROM_EMAIL="noreply@sbalinkup.com"
   ```

4. **Set up the database**
   ```bash
   node scripts/setup-db.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗 Database Setup

This project uses PostgreSQL for data storage. The database schema includes:

- **Users** - Student, professional, and admin accounts
- **Job Postings** - Job opportunities with skills matching
- **Job Applications** - Application tracking and status management
- **Messages & Conversations** - Real-time messaging system
- **Interviews** - Scheduling and management
- **Notifications** - User notifications and alerts

### Setup with Neon (Recommended)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string to your `.env.local` file
4. Run the setup script: `node scripts/setup-db.js`

## 🔐 Default Admin Account

- **Email**: arjundevkapur@gmail.com
- **Password**: password
- **Role**: Admin

## 🎯 User Roles

- **Students**: Create profiles, apply for jobs, message professionals
- **Professionals**: Post jobs, review applications, schedule interviews
- **Admins**: Manage users, moderate content, view analytics

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

### Users
- `GET /api/users` - Get all users (with filtering)
- `GET /api/users/[id]` - Get specific user
- `PUT /api/users/[id]` - Update user profile
- `DELETE /api/users/[id]` - Delete user (admin only)

### Jobs
- `GET /api/jobs` - Get all jobs (with filtering)
- `POST /api/jobs` - Create job posting (professionals only)
- `POST /api/jobs/[id]/apply` - Apply for job (students only)
- `GET /api/jobs/[id]/applications` - Get job applications
- `PUT /api/jobs/[id]/applications` - Update application status
- `GET /api/jobs/matching` - Smart job/student matching

### Messaging
- `GET /api/messages` - Get user conversations
- `POST /api/messages` - Send message
- `GET /api/messages/[conversationId]` - Get conversation messages
- `PUT /api/messages/[conversationId]` - Mark messages as read

### Interviews
- `GET /api/interviews` - Get user interviews
- `POST /api/interviews` - Schedule interview

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications` - Update notification status
- `DELETE /api/notifications` - Delete notifications

## 📄 Key Pages

- `/` - Landing page and authentication
- `/dashboard` - User dashboard with personalized content
- `/jobs` - Job board with smart matching
- `/directory` - User directory and networking
- `/messages` - Real-time messaging system
- `/interviews` - Interview scheduling and management
- `/profile` - Profile management and settings
- `/admin` - Admin dashboard (admin only)

## 🔧 Development

The application follows modern React patterns:
- **Server and Client Components** - Optimized rendering
- **TypeScript** - Full type safety
- **Responsive Design** - Mobile-first approach
- **Real-time Features** - Live messaging and notifications
- **Secure Authentication** - JWT-based auth with proper validation

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── (pages)/          # App pages
├── components/           # React components
├── lib/                 # Utilities and configurations
│   ├── auth.ts         # Authentication utilities
│   ├── database.ts     # Database connection
│   ├── schema.sql      # Database schema
│   └── seed.sql        # Sample data
├── scripts/            # Setup and utility scripts
└── types/             # TypeScript type definitions
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database
- **Production**: Use Neon, Supabase, or any PostgreSQL provider
- **Staging**: Can use the same providers with separate databases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
