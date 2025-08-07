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

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Neon PostgreSQL (Serverless)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## 🏗 Database Setup

This project uses Neon PostgreSQL for data storage. To set up:

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new database
3. Add your `DATABASE_URL` to environment variables
4. Run the setup scripts to create tables and seed data

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables:
   \`\`\`bash
   DATABASE_URL=your_neon_database_url
   \`\`\`
4. Run database setup scripts
5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 🔐 Default Admin Account

- **Email**: arjundevkapur@gmail.com
- **Password**: password
- **Role**: Admin

## 🎯 User Roles

- **Students**: Create profiles, apply for jobs, message professionals
- **Professionals**: Post jobs, review applications, schedule interviews
- **Admins**: Manage users, moderate content, view analytics

## 📱 Key Pages

- `/` - Landing page and authentication
- `/dashboard` - User dashboard with personalized content
- `/jobs` - Job board with smart matching
- `/directory` - User directory and networking
- `/messages` - Real-time messaging system
- `/interviews` - Interview scheduling and management
- `/profile` - Profile management and settings
- `/admin` - Admin dashboard (admin only)

## 🔧 Development

The application is built with modern React patterns:
- Server and Client Components
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Real-time data with PostgreSQL
- Secure authentication flow

## 🚀 Deployment

Ready for deployment on Vercel with automatic Neon database integration.

## 📄 License

MIT License - see LICENSE file for details
\`\`\`
