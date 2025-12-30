# KhataX - Mess Management System Setup Guide

## Overview

KhataX is a comprehensive SaaS mess management system built with Next.js, featuring:
- Member registration & dashboard
- Daily expense tracking
- Auto-generated bazar schedule (4-day gap, semester break support)
- Monthly expense calculation & balance settlement
- PDF/Email invoice generation
- Google login (Firebase)
- Admin/Manager panel

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (or MySQL) - *to be configured*
- **Storage**: Firebase Storage (for images and bazar uploads)
- **Auth**: Firebase Google Authentication
- **PDF**: jsPDF with autoTable
- **Email**: Nodemailer

## Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase project
- PostgreSQL database (or MySQL)
- SMTP email account (Gmail recommended)

## Installation

1. **Clone and install dependencies:**
```bash
npm install
# or
pnpm install
```

2. **Set up Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Google Authentication
   - Enable Firebase Storage
   - Copy your Firebase config values

3. **Set up environment variables:**
   - Create `.env.local` file
   - Fill in all required values:
     - `MONGODB_URI` - MongoDB connection string
     - `JWT_SECRET` - Secret key for JWT token generation (use a strong random string in production)
     - Firebase configuration (if using Firebase)
     - SMTP email settings (if using email features)

4. **Set up database:**
   - Create a MongoDB database (or use MongoDB Atlas)
   - Set up MongoDB connection string in `.env.local` as `MONGODB_URI`
   - Database schema is defined in `types/index.ts`

5. **Initialize Manager Account:**
   - After setting up the database, call the initialization endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/auth/init-manager
   ```
   - Or visit the endpoint in your browser after starting the dev server
   - Manager credentials:
     - Email: `manager@gmail.com`
     - Password: `manager123`
   - Manager login page: `/auth/login`

## Database Schema

The system uses the following main tables:
- `users` - User accounts with Google authentication
- `members` - Member financial data
- `daily_expenses` - Daily expense records
- `bazar_list` - Auto-generated bazar schedule
- `transactions` - Transaction history
- `semester_breaks` - Semester break periods

## Project Structure

```
khataxapp/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Member dashboard
│   └── manager/           # Manager panel
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── tables/           # Table components
│   └── forms/            # Form components
├── lib/                   # Utilities and services
│   ├── firebase.ts       # Firebase config
│   ├── api-client.ts     # API client
│   ├── pdf-generator.ts  # PDF generation
│   ├── email.ts          # Email service
│   └── bazar-scheduler.ts # Bazar scheduling logic
└── types/                 # TypeScript types
```

## Key Features

### Member Features
- View deposit, balance, extras, total expense
- Download invoices (PDF)
- Upload daily expense (if allowed)
- Google login & registration

### Manager/Admin Features
- Add new members
- Approve/calculate monthly totals
- Enter expenses & manage daily expense table
- Generate auto bazar list (4-day gap, skip breaks)
- Send bulk invoices (PDF + Email)
- View summary tables (member balances, total border, manager receivable)

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Routes

All API routes are in `app/api/`:
- `/api/auth/*` - Authentication endpoints
  - `/api/auth/login` - Manager email/password login
  - `/api/auth/check-user` - Check if user exists (Google auth)
  - `/api/auth/register` - Register new member
  - `/api/auth/init-manager` - Initialize manager account (POST/GET)
- `/api/members/*` - Member management
- `/api/expenses/*` - Expense management
- `/api/bazar/*` - Bazar schedule management
- `/api/settlement/*` - Monthly settlement
- `/api/invoices/*` - Invoice generation and emailing

## Authentication

### Manager Login
- Managers can log in using email/password at `/auth/login`
- Default credentials: `manager@gmail.com` / `manager123`
- After login, managers receive a JWT token with 20-day expiration
- Token is stored in localStorage and sent in Authorization header for API requests
- After login, managers are redirected to `/manager` dashboard

### User Login
- Regular users sign in with Google OAuth on the landing page
- New users are redirected to registration page
- Existing users go to their dashboard based on role

## Next Steps

1. **Database Integration:**
   - Set up database connection (Prisma/TypeORM recommended)
   - Implement database queries in API routes
   - Add migration system

2. **File Upload:**
   - Implement Firebase Storage integration for bazar list uploads
   - Add image upload for member pictures

3. **Authentication:**
   - ✅ JWT token-based authentication with 20-day expiration
   - ✅ Token verification middleware for protected routes
   - ✅ Role-based access control utilities

4. **Testing:**
   - Add unit tests
   - Add integration tests
   - Add E2E tests

## Notes

- All components are reusable and follow shadcn/ui patterns
- The system is designed to be mobile-friendly
- PDF generation uses jsPDF with autoTable plugin
- Email system supports attachments and bulk sending
- Bazar scheduler automatically skips semester breaks

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

