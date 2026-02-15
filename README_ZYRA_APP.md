# Zyra — Collaborative Project Platform

A platform where founders connect with builders to start and contribute to projects.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` (00001 and 00002)
3. In Supabase Dashboard > Authentication > Providers:
   - Enable Google, GitHub, and X (Twitter)
   - Add your OAuth redirect URL: `https://yourdomain.com/auth/callback`
   - For local dev: `http://localhost:3000/auth/callback`
4. Create storage buckets `avatars`, `project-covers`, `project-banners` if not created by migration

### 3. Run the App

```bash
npm install
npm run dev
```

## Features

- **Auth:** Sign in with Google, GitHub, or X
- **Profile:** Complete qualifications (skills, GitHub/LinkedIn/Peerlist links)
- **Feed:** Browse projects with tabs (All, Open, Trending, Open source, Startups, Recommended)
- **Projects:** Create projects with cover, banner, contributor roles, links
- **Contributions:** Request to contribute; founders approve
- **Feedback:** Add feedback (instead of comments)
- **Upvote & Share:** Upvote projects; share link or post on X (members) / LinkedIn (contributors)
- **Products:** Launched projects appear in Products with links and activity summary
- **Dashboard:** My Projects and My Products
