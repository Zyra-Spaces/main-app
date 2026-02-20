import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/feed");

  const { data: qualifications } = await supabase
    .from("qualifications")
    .select("skill")
    .eq("user_id", user.id);
  const hasQualifications = qualifications && qualifications.length > 0;
  if (!hasQualifications) redirect("/onboarding");

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
    .neq("status", "draft")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const founderIds = [...new Set((projects ?? []).map((p) => p.founder_id))];
  const { data: founderProfiles } =
    founderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", founderIds)
      : { data: [] };
  const founderMap = new Map((founderProfiles ?? []).map((p) => [p.id, p]));
  const projectsWithFounders = (projects ?? []).map((p) => ({
    ...p,
    profiles: founderMap.get(p.founder_id) ?? null,
  }));

  const { data: upvotesData } = await supabase
    .from("upvotes")
    .select("project_id");

  const upvoteCounts = (upvotesData ?? []).reduce(
    (acc, u) => {
      acc[u.project_id] = (acc[u.project_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const { data: userUpvotes } = user
    ? await supabase.from("upvotes").select("project_id").eq("user_id", user.id)
    : { data: [] };
  const userUpvotedSet = new Set((userUpvotes ?? []).map((u) => u.project_id));

  const projectsWithMeta = projectsWithFounders.map((p) => ({
    ...p,
    upvoteCount: upvoteCounts[p.id] ?? 0,
    userUpvoted: userUpvotedSet.has(p.id),
  }));

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <FeedClient
          initialProjects={projectsWithMeta}
          userId={user.id}
          userQualifications={qualifications?.map((q) => q.skill) ?? []}
        />
      </div>
    </div>
  );
}
