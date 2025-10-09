# Prop Shop AI Website

A modern, AI-powered proposal management platform built with Next.js 15, Supabase, and SendGrid.

## Features

- **Authentication & User Management**: Secure user authentication with Supabase Auth
- **Proposal Management**: Create, edit, and track proposals with AI assistance
- **Opportunity Tracking**: Manage sales opportunities and pipeline
- **Meeting Management**: Schedule and track client meetings
- **Email Notifications**: Automated emails via SendGrid
- **Dashboard Analytics**: Comprehensive reporting and insights
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Updates**: Live data synchronization with Supabase

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4.0
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Email**: SendGrid
- **Deployment**: Vercel
- **Authentication**: Supabase Auth with Row Level Security

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- SendGrid account
- Vercel account (for deployment)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd PropShop_AI_Website
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your values:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Prop Shop AI

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Prop Shop AI
```

### 3. Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project credentials** from Settings > API
3. **Run the database schema** from `src/lib/database-schema.sql` in the Supabase SQL Editor
4. **Configure Row Level Security (RLS)** - the schema includes policies
5. **Set up authentication** in Authentication > Settings

### 4. SendGrid Setup

1. **Create a SendGrid account** at [sendgrid.com](https://sendgrid.com)
2. **Generate an API key** in Settings > API Keys
3. **Verify your sender domain** in Settings > Sender Authentication
4. **Set up email templates** (optional, basic templates are included)

### 5. Development

```bash
npm run dev
```

Your site will be available at `http://localhost:3000`

### 6. Build and Deploy

```bash
npm run build
npm run deploy
```

## Project Structure

```
src/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── ...                # Other pages
├── components/            # Reusable components
│   ├── ui/               # UI components (buttons, forms, etc.)
│   ├── layout/           # Layout components
│   └── sections/         # Page sections
├── contexts/              # React contexts
├── lib/                   # Utilities and configurations
│   ├── supabase.ts       # Supabase client configuration
│   ├── sendgrid.ts       # SendGrid email service
│   ├── types.ts          # TypeScript type definitions
│   └── database-schema.sql # Database schema
└── ...
```

## Database Schema

The application uses a comprehensive database schema with the following main tables:

- **profiles**: User profiles and settings
- **companies**: Company information
- **proposals**: Proposal management
- **opportunities**: Sales opportunity tracking
- **meetings**: Meeting scheduling
- **demo_requests**: Demo request management
- **activity_log**: User activity tracking

All tables include Row Level Security (RLS) policies for data protection.

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out

### Proposals
- `GET /api/proposals` - List user proposals
- `POST /api/proposals` - Create new proposal
- `PUT /api/proposals` - Update proposal
- `DELETE /api/proposals` - Delete proposal

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics and charts

### Demo Requests
- `POST /api/demo-request` - Submit demo request

## Authentication Flow

1. **Sign Up**: Users create accounts with email verification
2. **Sign In**: Secure authentication with Supabase Auth
3. **Profile Creation**: Automatic profile creation on first sign in
4. **Session Management**: Persistent sessions with automatic refresh
5. **Row Level Security**: Data access controlled by user ownership

## Email System

The application uses SendGrid for automated emails:

- **Welcome Emails**: Sent to new users
- **Password Reset**: Secure password reset links
- **Demo Confirmations**: User confirmation emails
- **Admin Notifications**: Team notifications for new requests

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting (configure in Vercel)
- **CORS Protection**: Cross-origin request protection

## Deployment

### Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Environment Variables in Vercel

Add all your environment variables in the Vercel dashboard:
- Go to your project settings
- Navigate to Environment Variables
- Add each variable from your `.env.local` file

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow Next.js 15 app directory conventions
- Use Tailwind CSS for styling
- Implement proper error handling
- Add comprehensive logging

### Testing

- Test all API endpoints
- Verify authentication flows
- Test email functionality
- Validate database operations

### Performance

- Implement proper database indexing
- Use Supabase real-time subscriptions sparingly
- Optimize images and assets
- Implement proper caching strategies

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Verify your environment variables
2. **Email Not Sending**: Check SendGrid API key and domain verification
3. **Authentication Errors**: Verify Supabase Auth configuration
4. **Database Errors**: Check RLS policies and table permissions

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=supabase:*
```

## Support

For technical support or questions:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check [SendGrid documentation](https://sendgrid.com/docs)

## License

This project is proprietary software. All rights reserved.

## Contributing

This is a private project. Please contact the development team for contribution guidelines.
# Updated at Sat Aug 30 12:23:02 EDT 2025
# Cron Job Setup Complete
# UI Improvements Deployed
