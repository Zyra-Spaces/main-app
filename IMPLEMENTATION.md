# Zyra — Full Implementation Documentation

This document describes the complete implementation of the Zyra collaborative project platform: tech stack, data model, routes, auth, features, design system, and setup.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema & RLS](#4-database-schema--rls)
5. [Storage](#5-storage)
6. [Authentication](#6-authentication)
7. [Routes & Pages](#7-routes--pages)
8. [Design System](#8-design-system)
9. [Key Features & Data Flows](#9-key-features--data-flows)
10. [API Routes](#10-api-routes)
11. [Architectural Improvements](#11-architectural-improvements)
12. [Setup & Deployment](#12-setup--deployment)

---

## 1. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| React | React 19 |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS 3.4 |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage) |
| Auth | Supabase Auth (OAuth: Google, GitHub, X) |
| Client packages | `@supabase/supabase-js`, `@supabase/ssr` |
| UI utilities | `class-variance-authority`, `clsx`, `tailwind-merge` |
| Fonts | Nunito Sans, Inconsolata (Google), Geist Mono, Geist Pixel Square |
| Animation | Framer Motion 11 |
| Optional (landing) | Nodemailer, Google APIs (waitlist) |

---

## 2. Project Structure

```
zyra-landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, fonts, AuthProvider
│   │   ├── page.tsx                   # Landing (hero, features, waitlist)
│   │   ├── globals.css                # Design tokens, button accents
│   │   ├── (auth)/
│   │   │   ├── layout.tsx             # Auth pages layout
│   │   │   ├── login/page.tsx         # OAuth login (Google, GitHub, X)
│   │   │   └── register/page.tsx     # Redirects to /login
│   │   ├── auth/
│   │   │   └── callback/route.ts      # OAuth callback, onboarding redirect
│   │   ├── api/
│   │   │   └── waitlist/route.ts      # Waitlist signup (Sheets + email)
│   │   ├── onboarding/
│   │   │   ├── page.tsx               # Profile completion (server)
│   │   │   └── onboarding-form.tsx     # Qualifications + links form
│   │   ├── profile/
│   │   │   ├── page.tsx               # Current user profile
│   │   │   ├── profile-edit-form.tsx  # Edit profile client form
│   │   │   └── [id]/page.tsx          # Public profile by user ID
│   │   ├── feed/
│   │   │   ├── page.tsx               # Project feed (server data)
│   │   │   └── feed-client.tsx        # Tabs, search, project cards
│   │   ├── projects/
│   │   │   ├── new/
│   │   │   │   ├── page.tsx           # Create project (server)
│   │   │   │   └── create-project-form.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # Project detail (server)
│   │   │       └── project-detail-client.tsx  # Feedback, requests, share
│   │   ├── products/
│   │   │   ├── page.tsx               # All products (launched projects)
│   │   │   └── [id]/page.tsx          # Product detail
│   │   └── dashboard/
│   │       └── page.tsx               # My Projects / My Products tabs
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navbar.tsx             # Nav: auth-aware links
│   │   │   └── footer.tsx
│   │   ├── sections/
│   │   │   ├── hero-section.tsx
│   │   │   ├── features-section.tsx
│   │   │   └── waitlist-section.tsx
│   │   ├── projects/
│   │   │   ├── project-card.tsx       # Feed card: upvote, share, link
│   │   │   └── milestones-section.tsx # Milestones UI (add, status)
│   │   ├── notifications/
│   │   │   └── notification-bell.tsx  # Notification dropdown + realtime
│   │   └── ui/
│   │       ├── button.tsx             # CVA variants + L-shaped corners
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── card.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── tabs.tsx
│   │       ├── dotted-glow-background.tsx
│   │       ├── background-ripple-effect.tsx
│   │       └── dither-shader.tsx
│   ├── lib/
│   │   ├── utils.ts                   # cn()
│   │   ├── database.types.ts          # Supabase table types
│   │   ├── auth-context.tsx           # AuthProvider, useAuth()
│   │   └── supabase/
│   │       ├── client.ts              # Browser client
│   │       ├── server.ts              # Server client (cookies)
│   │       └── middleware.ts         # updateSession(), route protection
│   └── middleware.ts                 # Next.js middleware (calls updateSession)
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 00001_initial_schema.sql   # Tables, enums, trigger, RLS
│       ├── 00002_storage_buckets.sql # Buckets + storage RLS
│       └── 00003_architectural_improvements.sql # Notifications, milestones, analytics, soft deletes, search
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── README_ZYRA_APP.md
└── IMPLEMENTATION.md                   # This file
```

---

## 3. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `GOOGLE_CLIENT_EMAIL` | No | Waitlist: Google Sheets service account email |
| `GOOGLE_PRIVATE_KEY` | No | Waitlist: Service account private key |
| `GOOGLE_SHEET_ID` | No | Waitlist: Spreadsheet ID |
| `EMAIL_USER` | No | Waitlist: Gmail user |
| `EMAIL_PASS` | No | Waitlist: Gmail app password |
| `ADMIN_EMAIL` | No | Waitlist: Admin notification email |

---

## 4. Database Schema & RLS

### 4.1 Tables

- **profiles** — Extends auth.users. `id` = auth user id. Fields: email, full_name, avatar_url, github_url, linkedin_url, peerlist_url, created_at, updated_at.
- **qualifications** — Per-user skills. user_id, skill, level.
- **projects** — founder_id, name, description, category (enum), status (enum), cover_url, banner_url, start_date, end_date, execution_type (enum), created_at, updated_at.
- **contributor_roles** — Roles needed per project: project_id, role, count.
- **project_members** — Approved contributors: project_id, user_id, role, status (= 'approved').
- **contributor_requests** — Pending join requests: project_id, user_id, role, status (pending/approved/rejected).
- **upvotes** — project_id, user_id (unique per project).
- **feedback** — project_id, user_id, content, created_at, updated_at. (Labeled "Feedback" in UI.)
- **products** — Launched projects: project_id, name, url, activity_summary (JSONB).
- **project_posts** — Founder updates: project_id, content, created_at.
- **project_links** — project_id, type (github/linkedin/peerlist), url.
- **notifications** — user_id (recipient), type, actor_id, project_id, milestone_id, read_status, message, created_at. Types: contributor_request, request_approved, request_rejected, feedback, project_update, milestone_created, milestone_completed.
- **project_milestones** — project_id, title, description, status (pending/in_progress/completed/cancelled), target_date, created_at, updated_at.
- **project_analytics** — project_id (unique), view_count, unique_viewers, last_viewed_at, created_at, updated_at.

### 4.2 Enums

- **project_category**: open_source, startup, side_project, hackathon, community
- **project_status**: draft, open, in_progress, closed
- **execution_type**: idea, building, launched
- **contributor_request_status**: pending, approved, rejected
- **link_type**: github, linkedin, peerlist
- **NotificationType**: contributor_request, request_approved, request_rejected, feedback, project_update, milestone_created, milestone_completed
- **MilestoneStatus**: pending, in_progress, completed, cancelled

### 4.3 Trigger

- **on_auth_user_created** — After INSERT/UPDATE on auth.users, upserts into `profiles` (id, email, full_name, avatar_url from raw_user_meta_data).
- **update_project_search_vector** — Before INSERT/UPDATE on projects, updates `search_vector` tsvector from name (weight A), description (weight B), category (weight C).
- **notify_contributor_request** — After INSERT on contributor_requests, creates notification for project founder.
- **notify_request_status_change** — After UPDATE on contributor_requests (status change), creates notification for requester (approved/rejected).
- **notify_feedback** — After INSERT on feedback, creates notification for project founder (unless founder wrote it).
- **notify_milestone_created** — After INSERT on project_milestones, creates notifications for all approved project members.
- **increment_project_view** — Function to increment view_count in project_analytics (called on project detail page view).

### 4.4 Row Level Security (Summary)

- **profiles**: SELECT all; INSERT/UPDATE own row.
- **qualifications**: SELECT all; ALL for own user_id.
- **projects**: SELECT if not draft or founder; ALL for founder.
- **contributor_roles**: SELECT if project visible; ALL for project founder.
- **project_members**: SELECT if project visible; ALL for founder.
- **contributor_requests**: SELECT if requester or project founder; INSERT as requester; UPDATE for founder.
- **upvotes**: SELECT all; ALL for own user_id.
- **feedback**: SELECT if project visible; INSERT authenticated; UPDATE/DELETE own.
- **products, project_posts, project_links**: SELECT if project visible; ALL for project founder.
- **notifications**: SELECT/UPDATE for own user_id.
- **project_milestones**: SELECT if project visible; ALL for project founder.
- **project_analytics**: SELECT if project visible; INSERT/UPDATE for all (for view tracking).

---

## 5. Storage

### 5.1 Buckets (Migration 00002)

| Bucket | Public | Size limit | MIME | Path pattern |
|--------|--------|------------|------|--------------|
| avatars | Yes | 2 MB | image/* | `{user_id}/...` |
| project-covers | Yes | 5 MB | image/* | `{project_id}/...` |
| project-banners | Yes | 5 MB | image/* | `{project_id}/...` |

### 5.2 Storage RLS

- **avatars**: Insert/Update/Delete only for objects where first path segment = auth.uid()::text; SELECT for all.
- **project-covers / project-banners**: Insert/Update/Delete only when project exists and founder_id = auth.uid(); SELECT for all.

---

## 6. Authentication

### 6.1 Flow

1. User visits `/login` and clicks a provider (Google, GitHub, or X).
2. `signInWithOAuth()` is called with `redirectTo`: `{origin}/auth/callback?next={redirect}`.
3. Supabase redirects to provider, then back to `/auth/callback?code=...&next=...`.
4. **Auth callback** (`/auth/callback`): Exchanges `code` for session via `exchangeCodeForSession(code)`. If success: if user has no qualifications, redirect to `/onboarding`; else redirect to `next` (default `/feed`).
5. Session is stored in cookies; middleware refreshes it on each request.

### 6.2 Supabase Clients

- **Browser** (`src/lib/supabase/client.ts`): `createBrowserClient(URL, ANON_KEY)` — used in Client Components and for OAuth.
- **Server** (`src/lib/supabase/server.ts`): `createServerClient(URL, ANON_KEY, { cookies: getAll/setAll })` — used in Server Components, Route Handlers, Server Actions.
- **Middleware** (`src/lib/supabase/middleware.ts`): Same as server but uses request/response cookies for session refresh; also enforces route protection.

### 6.3 Route Protection (Middleware)

- **Protected (require auth)**: `/dashboard`, `/onboarding`, `/profile` (exact), `/projects/new`. If no user, redirect to `/login?redirect={pathname}`.
- **Auth pages**: `/login`, `/register`. If user exists, redirect to `/feed`.
- **Middleware entry**: Next.js middleware at `src/middleware.ts` calls `updateSession(request)` and uses a matcher to skip static assets.

### 6.4 Auth Context

- **AuthProvider** (in root layout): Subscribes to `onAuthStateChange`, exposes `user`, `loading`, `signOut()`.
- **useAuth()**: Used in Navbar and other client components to show/hide links and sign out.

---

## 7. Routes & Pages

| Route | Purpose | Auth | Notes |
|-------|---------|------|--------|
| `/` | Landing | No | Hero, features, waitlist |
| `/login` | OAuth login | Redirect if auth | Google, GitHub, X buttons |
| `/register` | Redirect to login | Redirect if auth | |
| `/auth/callback` | OAuth callback | - | Exchange code; redirect to onboarding or next |
| `/onboarding` | Profile completion | Required | Qualifications + GitHub/LinkedIn/Peerlist |
| `/feed` | Project feed | Required | Tabs, search, project cards |
| `/projects/new` | Create project | Required | Form: name, description, category, execution_type, dates, cover, banner, roles, links |
| `/projects/[id]` | Project detail | No | Hero, contributors, feedback, requests, share |
| `/profile` | Current user profile | Required | Redirect to onboarding if no qualifications |
| `/profile/[id]` | Public profile | No | View only |
| `/products` | Products list | No | Launched projects |
| `/products/[id]` | Product detail | No | Link + activity summary |
| `/dashboard` | My projects & products | Required | Tabs: My Projects, My Products |
| `/api/waitlist` | Waitlist signup | No | POST; optional Sheets + email |

---

## 8. Design System

### 8.1 Theme (globals.css)

- **Mode**: Dark (class on html).
- **Tokens**: HSL-based (e.g. --background 0 0% 4%, --foreground 0 0% 100%, --card, --primary, --secondary, --muted, --accent, --destructive, --border, --input, --ring). --radius: 0.75rem. Neutral grays for glows.
- **Fonts**: --font-nunito-sans, --font-inconsolata, Geist Mono, Geist Pixel Square (via layout and tailwind).

### 8.2 Tailwind (tailwind.config.ts)

- **Font families**: sans → Nunito Sans; nunito, inconsolata, geist-mono, geist-pixel.
- **Colors**: All mapped from CSS variables (background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, card).

### 8.3 Components

- **Button**: CVA variants (default, secondary, outline, ghost, link), sizes (default, sm, lg, xl, icon). L-shaped corner accents via `.btn-corner-accent-*` (dark for primary, outline for outline/secondary).
- **ButtonCornerWrapper**: Wraps link/button with corner accents (variant default | outline).
- **Input / Textarea**: Border, ring, font-inconsolata, consistent height/padding.
- **Card**: Rounded border, bg-card, CardHeader/CardTitle/CardDescription/CardContent/CardFooter.
- **Avatar**: Circular; AvatarImage + AvatarFallback.
- **Badge**: CVA variants (default, secondary, outline, muted).
- **Tabs**: Controlled or uncontrolled (value/onValueChange or defaultValue); TabsList, TabsTrigger, TabsContent.

### 8.4 Project vs User Imagery

- **Project cover**: Boxed (rounded-xl), used in cards and project detail.
- **Project banner**: Wider aspect (e.g. 3:1) on project detail.
- **User avatar**: Circular (Avatar component).

---

## 9. Key Features & Data Flows

### 9.1 Profile Completion (Onboarding)

- After first login, if no qualifications: redirect to `/onboarding`.
- Form: qualifications (skill + level, add/remove rows), GitHub/LinkedIn/Peerlist URLs.
- On submit: update `profiles` (links), delete then re-insert `qualifications` for user. Redirect to `/feed`.

### 9.2 Project Creation

- Form: name, description, category, execution_type, start_date, end_date, cover file, banner file, contributor_roles (role + count), project_links (github, linkedin, peerlist).
- Flow: Insert project → upload cover to `project-covers/{project_id}/cover.{ext}`, banner to `project-banners/{project_id}/banner.{ext}` → update project with URLs → insert contributor_roles and project_links. If execution_type = 'launched', insert into `products`.

### 9.3 Feed

- Server: Load projects (non-draft), founder profiles, contributor_roles, upvote counts, current user upvotes. Pass to FeedClient.
- Client: Tabs (All, Open for contributors, Trending, Open source, Startups, Recommended). Search filters by name, description, category. Trending = sort by upvote count. Recommended = projects whose contributor_roles match user qualifications. Display: ProjectCard (cover, name, description, badges, founder, upvote, share).

### 9.4 Project Detail

- Server: Project, founder profile, contributor_roles, project_links, project_members (with profiles), contributor_requests (with profiles), project_posts, feedback (with author profiles), upvote count, user upvote status. Compute isFounder, isMember, isContributor.
- Client: Upvote, copy link, Post on X (if contributor), Share on LinkedIn (if contributor only). Founder: approve/reject contributor requests; add project posts. Any authenticated user: request to contribute (select role); add feedback.

### 9.5 Contributor Requests

- User submits request → insert `contributor_requests` (status pending). Founder approves → update request to approved, insert `project_members` (user_id, role, status approved). Reject → update request to rejected.

### 9.6 Upvote & Share

- **Upvote**: Toggle in project card and detail; insert/delete in `upvotes`. Counts shown on card and detail.
- **Share**: Copy link (always). Post on X: owner/member or approved contributor. Post on LinkedIn: only approved contributor (per plan).

### 9.7 Products

- **Products list**: Select from `products` with project info (name, description, cover). Execution_type 'launched' projects get a product row on creation.
- **Product detail**: Product + project description, product url, activity_summary (JSONB). Link to project page.

### 9.8 Dashboard

- **My Projects**: Projects where founder_id = current user, status != draft.
- **My Products**: Products whose project_id is in user’s founded projects. Tabs for Projects / Products.

---

## 10. API Routes

- **GET /auth/callback** — OAuth callback: exchange code for session; redirect to onboarding or next.
- **POST /api/waitlist** — Body: `{ email }`. Validates email; optionally appends to Google Sheet and/or sends confirmation email (when env vars set).

---

## 11. Architectural Improvements

### 11.1 Notifications System

**Purpose**: Real-time alerts for user actions (contributor requests, approvals, feedback, milestones).

**Implementation**:
- **Table**: `notifications` with user_id, type, actor_id, project_id, milestone_id, read_status, message.
- **Triggers**: PostgreSQL triggers automatically create notifications on:
  - Contributor request → notify founder
  - Request approval/rejection → notify requester
  - Feedback → notify founder (unless founder wrote it)
  - Milestone creation → notify all approved project members
- **UI**: `NotificationBell` component in Navbar with unread count badge, dropdown list, mark as read, real-time updates via Supabase Realtime.
- **Realtime**: Supabase channel subscription on `notifications` table for INSERT events filtered by user_id.

**Files**:
- `src/components/notifications/notification-bell.tsx` — Bell icon, dropdown, mark read
- Migration: triggers in `00003_architectural_improvements.sql`

### 11.2 Soft Deletes

**Purpose**: Preserve historical data when projects are "deleted" (for analytics, recovery).

**Implementation**:
- Added `deleted_at TIMESTAMPTZ` column to `projects` table.
- All project queries filter `WHERE deleted_at IS NULL`.
- RLS policies updated to exclude soft-deleted projects.
- Founders can "delete" by setting `deleted_at = now()`; can restore by setting `deleted_at = NULL`.

**Migration**: `00003_architectural_improvements.sql` adds column and updates RLS.

### 11.3 Enhanced Search (Fuzzy + Full-Text)

**Purpose**: Typo-tolerant search and better relevance ranking.

**Implementation**:
- **pg_trgm extension**: Enabled for trigram similarity matching (handles typos like "Statup" → "Startup").
- **Full-text search**: `search_vector` tsvector column on projects (generated from name, description, category).
- **Indexes**: GIN index on `search_vector` for fast full-text queries; GIN indexes on name/description with `gin_trgm_ops` for fuzzy matching.
- **Server-side search**: PostgreSQL function `search_projects()` uses `similarity()` for fuzzy matching. API route `/api/projects/search` calls function and returns results with upvotes and founder profiles.
- **Feed search**: Client-side debounced search (300ms) calls API when query is 2+ characters. Removed client-side fuzzy logic in favor of server-side.

**Files**:
- Migration: `00003_architectural_improvements.sql` (extension, column, trigger, indexes, search function)
- `src/app/api/projects/search/route.ts` — Search API endpoint
- `src/app/feed/feed-client.tsx` — Client-side search integration (debounced API calls)

### 11.4 Project Milestones

**Purpose**: Roadmap/checklist for projects (gives contributors clarity on what needs to be done).

**Implementation**:
- **Table**: `project_milestones` with project_id, title, description, status (pending/in_progress/completed/cancelled), target_date.
- **UI**: `MilestonesSection` component on project detail page. Founders can add/edit milestones, change status. Contributors see roadmap.
- **Notifications**: When milestone created, all approved project members get notified.

**Files**:
- `src/components/projects/milestones-section.tsx` — Milestone list, add form, status updates
- Migration: table + RLS in `00003_architectural_improvements.sql`

### 11.5 Project Analytics (View Tracking)

**Purpose**: Track project views for "Trending" algorithm and insights.

**Implementation**:
- **Table**: `project_analytics` with project_id (unique), view_count, unique_viewers, last_viewed_at.
- **Function**: `increment_project_view(project_uuid)` — increments view_count atomically.
- **Usage**: Called on project detail page load (non-blocking).
- **Trending**: Feed "Trending" tab uses `upvoteCount * 2 + view_count + recency_score` for ranking.

**Files**:
- Migration: table + function in `00003_architectural_improvements.sql`
- `src/app/projects/[id]/page.tsx` — Calls increment function on page load
- `src/app/feed/feed-client.tsx` — Trending sort includes view_count

### 11.6 Image Optimization

**Purpose**: Reduce bandwidth and improve performance (5MB images → optimized thumbnails).

**Implementation**:
- **Custom loader**: `src/lib/supabase-image-loader.ts` — Uses Supabase's `/storage/v1/render/image/public/` endpoint with `?width={width}&quality={quality}` parameters.
- **Free tier fallback**: Detects `/object/public` URLs (free tier) and returns original URL. Only uses `/render/image` for Pro plan.
- **Next.js config**: `next.config.ts` sets `images.loader: "custom"` and `loaderFile: "./src/lib/supabase-image-loader.ts"`.
- **Usage**: All `<Image>` components automatically use loader (no `unoptimized` needed). ProjectCard uses optimized images for feed thumbnails.

**Note**: Supabase image transformations require Pro plan. For free tier, loader gracefully falls back to original URL (still benefits from Next.js Image component lazy loading).

**Files**:
- `src/lib/supabase-image-loader.ts` — Custom loader with free tier fallback
- `next.config.ts` — Image config
- `src/components/projects/project-card.tsx` — Uses optimized Image

### 11.7 Rate Limiting

**Purpose**: Prevent API abuse (spam on waitlist, feedback, project creation, upvotes).

**Implementation**:
- **Utility**: `src/lib/rate-limit.ts` — Simple in-memory rate limiter (identifier → count + resetAt).
- **Route-specific limits**:
  - Waitlist: 5/min per IP
  - Feedback: 10/min per user
  - Project creation: 3/hour per user
  - Upvote: 30/min per user
- **Usage**: Applied to:
  - `/api/waitlist` — IP-based limit
  - Feedback submission (`project-detail-client.tsx`) — User-based limit
  - Project creation (`create-project-form.tsx`) — User-based limit
  - Upvote (`project-card.tsx`) — User-based limit
- **Production**: For production, replace with Redis-based solution like `@upstash/ratelimit` (persistent across instances). Create `src/lib/rate-limit-redis.ts` as alternative implementation.

**Files**:
- `src/lib/rate-limit.ts` — Rate limit function + route-specific limiters
- `src/app/api/waitlist/route.ts` — Uses rate limiting
- `src/app/projects/[id]/project-detail-client.tsx` — Feedback rate limiting
- `src/app/projects/new/create-project-form.tsx` — Project creation rate limiting
- `src/components/projects/project-card.tsx` — Upvote rate limiting

### 11.8 Performance Indexes

**Purpose**: Faster queries for qualifications matching and search.

**Implementation**:
- `idx_qualifications_skill` — Faster "Recommended" feed matching
- `idx_contributor_roles_role` — Faster role matching
- `idx_projects_name_trgm` / `idx_projects_description_trgm` — Faster fuzzy search
- `idx_projects_search_vector` — Faster full-text search
- `idx_project_analytics_view_count` — Faster trending sort

**Migration**: All indexes in `00003_architectural_improvements.sql`

### 11.9 Server-Side Fuzzy Search

**Purpose**: Typo-tolerant search using PostgreSQL trigram similarity (e.g., "Statup" finds "Startup").

**Implementation**:
- **PostgreSQL function**: `search_projects(search_term, similarity_threshold)` — Uses `pg_trgm` extension's `similarity()` function to match projects by name, description, or category.
- **API route**: `/api/projects/search?q={query}` — Calls RPC function, fetches full project data with upvotes and founder profiles.
- **Client integration**: `feed-client.tsx` — Debounced search (300ms) calls API when query is 2+ characters. Removed client-side fuzzy logic.
- **Indexes**: `idx_projects_name_trgm`, `idx_projects_description_trgm` (GIN indexes) for fast similarity queries.

**Files**:
- `supabase/migrations/00003_architectural_improvements.sql` — Search function + indexes
- `src/app/api/projects/search/route.ts` — Search API endpoint
- `src/app/feed/feed-client.tsx` — Client-side search integration
- `src/app/api/upvotes/route.ts` — Helper endpoint for upvote data

### 11.10 Real-time Presence

**Purpose**: Show "X people viewing this project" and "Founder is online" indicators for engagement.

**Implementation**:
- **Component**: `src/components/projects/presence-indicator.tsx` — Uses Supabase Realtime Presence API.
- **Channel**: Subscribes to `project-${projectId}` channel, tracks user presence with metadata (user_id, is_founder).
- **Display**: Shows viewer count and founder online badge.
- **Integration**: Added to project detail page (`project-detail-client.tsx`).

**Files**:
- `src/components/projects/presence-indicator.tsx` — Presence tracking component
- `src/app/projects/[id]/project-detail-client.tsx` — Integration

### 11.11 Security Hardening

**Purpose**: Input validation, XSS prevention, and security best practices.

**Implementation**:
- **Input sanitization**:
  - Feedback: Max 2000 characters, HTML stripped, rate-limited
  - Project creation: Name max 100 chars, description max 2000 chars, HTML stripped
- **Service role key**: Never exposed to client. Only used server-side in API routes if needed (currently not used).
- **RLS verification**: All tables have RLS enabled. Policies verified in migrations.
- **Rate limiting**: Applied to all user-generated content endpoints.

**Files**:
- `src/app/projects/[id]/project-detail-client.tsx` — Feedback validation
- `src/app/projects/new/create-project-form.tsx` — Project creation validation

---

## 12. Setup & Deployment

### 11.1 Local

1. Clone repo, run `npm install`.
2. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In Supabase Dashboard: run migrations in order:
   - `00001_initial_schema.sql` — Core tables, RLS, trigger
   - `00002_storage_buckets.sql` — Storage buckets + RLS
   - `00003_architectural_improvements.sql` — Notifications, milestones, analytics, soft deletes, search indexes
   (Or use Supabase CLI: `supabase db push`)
4. Authentication → Providers: enable Google, GitHub, X; set redirect URL to `http://localhost:3000/auth/callback`. Configure each provider with client ID/secret from respective consoles.
5. Ensure storage buckets exist (migration 00002 creates them; if not, create avatars, project-covers, project-banners in Dashboard).
6. Run `npm run dev`; open `http://localhost:3000`.

### 11.2 Middleware

- Next.js expects a middleware at `src/middleware.ts` (or project root) that calls `updateSession` from `@/lib/supabase/middleware`. The matcher should exclude static files and images so session refresh runs only on app routes. If `src/middleware.ts` is missing, add it and export a middleware that calls `updateSession(request)` and set `config.matcher` as in the implementation plan.

### 11.3 Production

- Set production redirect URL in Supabase Auth (e.g. `https://yourdomain.com/auth/callback`).
- Ensure env vars are set in the hosting platform (Vercel, etc.).
- Build: `npm run build`; start: `npm run start`.

---

## Summary

Zyra is a Next.js 15 app using Supabase for PostgreSQL, Auth (OAuth), and Storage. The app provides a landing page, OAuth login, profile completion (qualifications + links), a project feed with tabs and fuzzy search, project creation with cover/banner and roles, contributor requests and approval, feedback, upvotes, sharing (link, X, LinkedIn by role), project posts by founders, milestones/roadmap, notifications system, and a products area for launched projects with links and activity summary. The design system uses a monotone dark theme, CSS variables, Tailwind, and shared UI components (buttons with L-shaped corners, cards, avatars, badges, tabs). Row Level Security and storage policies enforce access control on all Supabase resources.

**Architectural highlights**:
- **Notifications**: Real-time alerts via PostgreSQL triggers + Supabase Realtime
- **Soft deletes**: Projects preserve historical data
- **Server-side fuzzy search**: Typo-tolerant search with pg_trgm + PostgreSQL function + API route
- **Real-time presence**: "X people viewing" and "Founder is online" indicators
- **Milestones**: Project roadmap/checklist for clarity
- **Analytics**: View tracking for trending algorithm
- **Image optimization**: Custom Supabase loader with free tier fallback
- **Enhanced rate limiting**: Route-specific limits for feedback, project creation, upvotes
- **Security hardening**: Input validation, XSS prevention, sanitization
- **Performance indexes**: Optimized queries for search and recommendations
