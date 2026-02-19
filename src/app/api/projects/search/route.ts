import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("search_projects", {
      search_term: q,
      similarity_threshold: 0.2,
    });

    if (error) {
      console.error("[search]", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    const projectIds = (data ?? []).map((p: { id: string }) => p.id);
    if (projectIds.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const { data: projects } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        category,
        status,
        cover_url,
        execution_type,
        created_at,
        updated_at,
        founder_id,
        contributor_roles(role),
        project_analytics(view_count)
      `)
      .in("id", projectIds)
      .is("deleted_at", null);

    const founderIds = [...new Set((projects ?? []).map((p: { founder_id: string }) => p.founder_id))];
    const { data: founderProfiles } =
      founderIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", founderIds)
        : { data: [] };
    const founderMap = new Map((founderProfiles ?? []).map((p) => [p.id, p]));

    type ProjectWithProfiles = {
      id: string;
      founder_id: string;
      [key: string]: unknown;
      profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
    };
    const projectsWithFounders: ProjectWithProfiles[] = (projects ?? []).map((p) => ({
      ...p,
      profiles: founderMap.get(p.founder_id) ?? null,
    }));

    const { data: upvotesData } = await supabase
      .from("upvotes")
      .select("project_id")
      .in("project_id", projectIds);

    const upvoteCounts = (upvotesData ?? []).reduce(
      (acc: Record<string, number>, u: { project_id: string }) => {
        acc[u.project_id] = (acc[u.project_id] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const projectsWithMeta = projectsWithFounders.map((p) => ({
      ...p,
      upvoteCount: upvoteCounts[p.id] ?? 0,
    }));

    return NextResponse.json({ projects: projectsWithMeta });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
