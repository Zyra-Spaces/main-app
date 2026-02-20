import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TRENDING_LIMIT = 5;

export async function GET() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      category,
      cover_url,
      founder_id,
      updated_at
    `)
    .neq("status", "draft")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!projects || projects.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  const projectIds = projects.map((p) => p.id);
  const { data: upvotesData } = await supabase
    .from("upvotes")
    .select("project_id")
    .in("project_id", projectIds);

  const upvoteCounts: Record<string, number> = {};
  (upvotesData ?? []).forEach((u: { project_id: string }) => {
    upvoteCounts[u.project_id] = (upvoteCounts[u.project_id] ?? 0) + 1;
  });

  const withScores = projects.map((p) => ({
    ...p,
    upvoteCount: upvoteCounts[p.id] ?? 0,
    score: upvoteCounts[p.id] ?? 0,
  }));

  withScores.sort((a, b) => b.score - a.score || new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
  const top = withScores.slice(0, TRENDING_LIMIT);
  const founderIds = [...new Set(top.map((p) => p.founder_id))];
  const { data: founderProfiles } =
    founderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", founderIds)
      : { data: [] };
  const founderMap = new Map((founderProfiles ?? []).map((p) => [p.id, p]));

  const projectsWithMeta = top.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    cover_url: p.cover_url,
    upvoteCount: p.upvoteCount,
    profiles: founderMap.get(p.founder_id) ?? null,
  }));

  return NextResponse.json({ projects: projectsWithMeta });
}
