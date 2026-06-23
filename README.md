# Mini ATS

A compact applicant tracking system for customers and admins.

## Stack

- Vite
- React
- React Router
- Supabase Auth + Postgres
- Supabase Storage
- Plain CSS
- Vercel
- Gemini API

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with the required environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
```

3. Start the development server:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run seed:demo
```

## Architecture Overview

Mini ATS is a Vite React single-page application. React Router handles client-side navigation between the dashboard, jobs, candidates, pipeline, login, and admin pages.

Supabase provides authentication, Postgres data storage, row-level security, and private CV file storage. Customer users can only work with their own jobs, candidates, and applications. Admin users can create accounts and select a customer workspace to view or manage that customer's recruiting data.

The browser app uses the public Supabase URL and publishable anon key through `VITE_` environment variables. Server-only actions live in Vercel API routes under `api/`, where private keys can be used safely without exposing them to the browser.

The admin account creation flow calls `api/create-user.js`, which uses the Supabase service role key to create the auth user and matching profile row. The CV assessment flow calls `api/assess-cv.js`, verifies the logged-in user's access, downloads the candidate CV from Supabase Storage, sends it to Gemini, and returns a structured assessment against the selected job.

## Environment Variables

Browser-exposed variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Server-only variables:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
```

Do not commit real `.env` or `.env.local` values. Configure the same variables in Vercel for deployed environments.
