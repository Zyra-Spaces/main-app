-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  peerlist_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Qualifications (skills per user)
CREATE TABLE public.qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_qualifications_user_id ON public.qualifications(user_id);

-- Projects
CREATE TYPE project_category AS ENUM ('open_source', 'startup', 'side_project', 'hackathon', 'community');
CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'closed');
CREATE TYPE execution_type AS ENUM ('idea', 'building', 'launched');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category project_category NOT NULL,
  status project_status DEFAULT 'open' NOT NULL,
  cover_url TEXT,
  banner_url TEXT,
  start_date DATE,
  end_date DATE,
  execution_type execution_type DEFAULT 'idea' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_projects_founder_id ON public.projects(founder_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);

-- Contributor roles (roles needed per project)
CREATE TABLE public.contributor_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_contributor_roles_project_id ON public.contributor_roles(project_id);

-- Project members (approved contributors)
CREATE TYPE contributor_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status contributor_request_status DEFAULT 'approved' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id, role)
);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);

-- Contributor requests (pending join requests)
CREATE TABLE public.contributor_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status contributor_request_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_contributor_requests_project_id ON public.contributor_requests(project_id);
CREATE INDEX idx_contributor_requests_user_id ON public.contributor_requests(user_id);

-- Upvotes
CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_upvotes_project_id ON public.upvotes(project_id);
CREATE INDEX idx_upvotes_user_id ON public.upvotes(user_id);

-- Feedback (comments)
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_feedback_project_id ON public.feedback(project_id);

-- Products (launched projects)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  activity_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_products_project_id ON public.products(project_id);

-- Project posts (founder updates)
CREATE TABLE public.project_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_project_posts_project_id ON public.project_posts(project_id);

-- Project links (GitHub, LinkedIn, Peerlist)
CREATE TYPE link_type AS ENUM ('github', 'linkedin', 'peerlist');

CREATE TABLE public.project_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type link_type NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_project_links_project_id ON public.project_links(project_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

-- Profiles: read all, write own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Qualifications: read all, write own
CREATE POLICY "Qualifications viewable by everyone" ON public.qualifications FOR SELECT USING (true);
CREATE POLICY "Users can manage own qualifications" ON public.qualifications FOR ALL USING (auth.uid() = user_id);

-- Projects: read all (non-draft), write own
CREATE POLICY "Projects viewable if not draft" ON public.projects FOR SELECT USING (status != 'draft' OR founder_id = auth.uid());
CREATE POLICY "Founders can manage own projects" ON public.projects FOR ALL USING (auth.uid() = founder_id);

-- Contributor roles: read if project readable
CREATE POLICY "Contributor roles viewable with project" ON public.contributor_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.status != 'draft' OR p.founder_id = auth.uid()))
);
CREATE POLICY "Founders can manage contributor roles" ON public.contributor_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);

-- Project members: read with project
CREATE POLICY "Project members viewable with project" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.status != 'draft' OR p.founder_id = auth.uid()))
);
CREATE POLICY "Founders can manage project members" ON public.project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);

-- Contributor requests: read if project member or requester
CREATE POLICY "Contributor requests viewable by project founder or requester" ON public.contributor_requests FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);
CREATE POLICY "Users can create own requests" ON public.contributor_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Founders can update requests" ON public.contributor_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);

-- Upvotes: read all, write own
CREATE POLICY "Upvotes viewable by everyone" ON public.upvotes FOR SELECT USING (true);
CREATE POLICY "Users can manage own upvotes" ON public.upvotes FOR ALL USING (auth.uid() = user_id);

-- Feedback: read with project, insert/update own
CREATE POLICY "Feedback viewable with project" ON public.feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.status != 'draft' OR p.founder_id = auth.uid()))
);
CREATE POLICY "Authenticated can add feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON public.feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON public.feedback FOR DELETE USING (auth.uid() = user_id);

-- Products: read with project
CREATE POLICY "Products viewable with project" ON public.products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.status != 'draft' OR p.founder_id = auth.uid()))
);
CREATE POLICY "Founders can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);

-- Project posts: read with project
CREATE POLICY "Project posts viewable with project" ON public.project_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.status != 'draft' OR p.founder_id = auth.uid()))
);
CREATE POLICY "Founders can manage project posts" ON public.project_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);

-- Project links: read with project
CREATE POLICY "Project links viewable with project" ON public.project_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.status != 'draft' OR p.founder_id = auth.uid()))
);
CREATE POLICY "Founders can manage project links" ON public.project_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.founder_id = auth.uid())
);
