# SEWO - Content Creation Platform

A comprehensive content creation and management platform built with React, Vite, and Supabase. This application provides AI-powered content generation, multi-platform publishing, and advanced workflow management.

## Features

- **AI Content Generation**: Generate text, images, and videos using various AI providers
- **Multi-Platform Publishing**: Publish to WordPress, Airtable, Google Docs, and more
- **Advanced Editor**: Drag-and-drop content editor with real-time preview
- **Workspace Management**: Multi-user workspace support with role-based access
- **Integration Hub**: Connect with 20+ third-party services
- **Brand Guidelines**: Maintain consistent branding across all content
- **Analytics & Reporting**: Track content performance and user engagement

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Functions**: Vercel Serverless Functions
- **Authentication**: Supabase Auth with OAuth support
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Supabase Storage for media files

## Prerequisites

Before setting up the project, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Supabase Account** - [Sign up here](https://supabase.com)
4. **Vercel Account** - [Sign up here](https://vercel.com)
5. **Git** for version control

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sewo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
FAL_API_KEY=your-fal-key

# Third-party Integrations
AIRTABLE_API_KEY=your-airtable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
YOUTUBE_API_KEY=your-youtube-key
AMAZON_API_KEY=your-amazon-key

# Add all your API keys...
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the database migrations in order:

```sql
-- Run these SQL scripts in your Supabase SQL editor:
-- 1. 001_initial_schema.sql
-- 2. 002_rls_policies.sql
-- 3. 003_storage_setup.sql
-- 4. 004_auth_setup.sql
```

### 5. Storage Setup

In your Supabase dashboard:
1. Go to Storage
2. Create buckets: `images`, `videos`, `documents`, `private`
3. Configure bucket policies (handled by migration scripts)

### 6. Authentication Setup

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure site URL: `http://localhost:5173` (for development)
3. Add redirect URLs for OAuth providers
4. Enable email/password authentication
5. Configure OAuth providers (Google, GitHub, etc.)

### 7. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy from the main branch

### Environment Variables for Production

Add these variables in Vercel:

```bash
# Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# All your API keys...
```

### Database Migrations in Production

Run the SQL migration scripts in your production Supabase project.

## Project Structure

```
sewo/
├── api/                    # Vercel serverless functions
│   ├── ai/                # AI-related functions
│   ├── airtable/          # Airtable integration
│   ├── integrations/      # Third-party integrations
│   ├── media/             # File upload/storage
│   ├── webhooks/          # Webhook handlers
│   └── utils/             # Shared utilities
├── src/
│   ├── api/               # API client layer
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   └── utils/             # Utility functions
├── supabase/
│   └── migrations/        # Database migration scripts
└── vercel.json            # Vercel configuration
```

## API Functions

The application includes 200+ serverless functions organized by category:

### AI Functions
- LLM routing (OpenAI, Anthropic)
- Image generation (Midjourney, FAL.ai, Flux)
- Video generation (Runway, Veo3, Wavespeed)
- Text processing and analysis

### Integration Functions
- Airtable sync and publishing
- WordPress publishing
- Google Docs export
- Stripe payment processing
- YouTube/TikTok integration

### Webhook Functions
- Generic webhook receiver
- AI service callbacks
- Payment webhooks
- External service integrations

## Authentication

The application uses Supabase Auth with support for:

- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic link authentication
- Session management
- Role-based access control

## Database Schema

The database includes 58+ tables with comprehensive Row Level Security:

- **User Management**: Users, profiles, roles
- **Content**: Blog posts, pages, templates
- **Media**: Images, videos, documents
- **Integrations**: Credentials, webhooks
- **Analytics**: Usage tracking, performance metrics

## Security

- Row Level Security (RLS) on all tables
- API rate limiting
- Input validation and sanitization
- Secure file upload handling
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API function documentation

## License

This project is proprietary software. All rights reserved.