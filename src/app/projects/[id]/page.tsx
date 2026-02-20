import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProjectDetailClient } from "./project-detail-client";
import { MilestonesSection } from "@/components/projects/milestones-section";
import { getRoleLabel } from "@/lib/project-roles";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      contributor_roles(role, count),
      project_links(type, url),
      project_members(user_id, role),
      contributor_requests(id, user_id, role, status),
      project_posts(id, content, created_at)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!project || project.status === "draft") notFound();

  // Track view analytics (non-blocking, fire-and-forget)
  (async () => {
    try {
      const { error } = await supabase.rpc("increment_project_view", { project_uuid: id });
      if (error) {
        // Fallback if function doesn't exist yet - use upsert with increment
        const { data: existing } = await supabase
          .from("project_analytics")
          .select("view_count")
          .eq("project_id", id)
          .single();
        
        if (existing) {
          // Update existing record
          await supabase
            .from("project_analytics")
            .update({
              view_count: existing.view_count + 1,
              last_viewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("project_id", id);
        } else {
          // Create new record
          await supabase
            .from("project_analytics")
            .insert({
              project_id: id,
              view_count: 1,
              last_viewed_at: new Date().toISOString(),
            });
        }
      }
    } catch (err) {
      // Silently fail - analytics tracking shouldn't block page render
      console.error("[analytics]", err);
    }
  })();

  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const founderId = project.founder_id;
  const memberIds = [
    founderId,
    ...(project.project_members ?? []).map((m: { user_id: string }) => m.user_id),
    ...(project.contributor_requests ?? []).map((r: { user_id: string }) => r.user_id),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", memberIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const projectWithProfiles = {
    ...project,
    profiles: profileMap.get(founderId) ?? null,
    project_members: (project.project_members ?? []).map((m: { user_id: string; role: string }) => ({
      ...m,
      profiles: profileMap.get(m.user_id) ?? null,
    })),
    contributor_requests: (project.contributor_requests ?? []).map((r: { id: string; user_id: string; role: string; status: string }) => ({
      ...r,
      profiles: profileMap.get(r.user_id) ?? null,
    })),
  };

  const { data: feedbackRaw } = await supabase
    .from("feedback")
    .select("id, user_id, content, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const feedbackUserIds = [...new Set((feedbackRaw ?? []).map((f) => f.user_id))];
  const { data: feedbackProfiles } =
    feedbackUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", feedbackUserIds)
      : { data: [] };
  const feedbackProfileMap = new Map((feedbackProfiles ?? []).map((p) => [p.id, p]));
  const feedbackList = (feedbackRaw ?? []).map((f) => ({
    ...f,
    profiles: feedbackProfileMap.get(f.user_id) ?? null,
  }));

  const { count: upvoteCount } = await supabase
    .from("upvotes")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

  const userUpvoted = user
    ? (await supabase
        .from("upvotes")
        .select("id")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .single()).data != null
    : false;

  const isFounder = user?.id === projectWithProfiles.founder_id;
  const isMember = (projectWithProfiles.project_members ?? []).some(
    (m: { user_id: string }) => m.user_id === user?.id
  );
  const isContributor = isFounder || isMember;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-12 lg:px-[140px]">
          <div className="relative aspect-[3/1] bg-muted rounded-xl overflow-hidden mb-8">
            {projectWithProfiles.banner_url ? (
              <Image
                src={projectWithProfiles.banner_url}
                alt=""
                fill
                className="object-cover"
                sizes="896px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground">
                No banner
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="shrink-0">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-muted border-2 border-border">
                {projectWithProfiles.cover_url ? (
                  <Image
                    src={projectWithProfiles.cover_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground text-xs">
                    No cover
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-geist-pixel text-3xl font-bold">{projectWithProfiles.name}</h1>
                {isFounder && (
                  <Link
                    href={`/projects/${id}/edit`}
                    className="font-inconsolata text-sm text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/50 px-3 py-1.5 rounded transition-colors"
                  >
                    Edit project
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>{projectWithProfiles.category}</Badge>
                <Badge variant="secondary">{projectWithProfiles.execution_type}</Badge>
                <Badge variant="outline">{projectWithProfiles.status}</Badge>
              </div>
              {projectWithProfiles.profiles && (
                <Link
                  href={`/profile/${projectWithProfiles.founder_id}`}
                  className="flex items-center gap-2 mt-3 hover:opacity-80"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(projectWithProfiles.profiles as { avatar_url?: string }).avatar_url} />
                    <AvatarFallback>
                      {((projectWithProfiles.profiles as { full_name?: string }).full_name ?? "F").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-inconsolata text-sm">
                    {(projectWithProfiles.profiles as { full_name?: string }).full_name ?? "Founder"}
                  </span>
                </Link>
              )}
              {(projectWithProfiles.start_date || projectWithProfiles.end_date) && (
                <p className="font-inconsolata text-sm text-muted-foreground mt-2">
                  {projectWithProfiles.start_date && `Started: ${new Date(projectWithProfiles.start_date).toLocaleDateString()}`}
                  {projectWithProfiles.start_date && projectWithProfiles.end_date && " · "}
                  {projectWithProfiles.end_date && `Ends: ${new Date(projectWithProfiles.end_date).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 prose prose-invert max-w-none">
            <p className="font-inconsolata text-muted-foreground whitespace-pre-wrap">
              {projectWithProfiles.description}
            </p>
          </div>

          {(projectWithProfiles.project_links?.length ?? 0) > 0 && (
            <div className="mt-8">
              <h2 className="font-nunito text-lg font-semibold mb-2">Links</h2>
              <div className="flex flex-wrap gap-4">
                {projectWithProfiles.project_links.map((l: { type: string; url: string }) => (
                  <a
                    key={l.type}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-inconsolata text-sm text-muted-foreground hover:text-foreground capitalize"
                  >
                    {l.type}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-nunito text-lg font-semibold mb-2">Contributors needed</h2>
            <div className="flex flex-wrap gap-2">
              {(projectWithProfiles.contributor_roles ?? []).map((r: { role: string; count: number }) => (
                <Badge key={r.role} variant="secondary">
                  {r.count} {getRoleLabel(r.role)}
                </Badge>
              ))}
            </div>
          </div>

          {(projectWithProfiles.project_members?.length ?? 0) > 0 && (
            <div className="mt-8">
              <h2 className="font-nunito text-lg font-semibold mb-4">Contributors</h2>
              <div className="flex flex-wrap gap-4">
                {projectWithProfiles.project_members.map((m: { user_id: string; role: string; profiles: { id: string; full_name: string | null; avatar_url: string | null } | null }) => (
                  <Link
                    key={m.user_id}
                    href={`/profile/${m.user_id}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {(m.profiles?.full_name ?? "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-inconsolata text-sm block">
                        {m.profiles?.full_name ?? "User"}
                      </span>
                      <span className="font-inconsolata text-xs text-muted-foreground">
                        {m.role}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <MilestonesSection
            projectId={id}
            isFounder={isFounder}
            initialMilestones={milestones ?? []}
          />

          <ProjectDetailClient
            projectId={id}
            userId={user?.id}
            isFounder={isFounder}
            isContributor={isContributor}
            upvoteCount={upvoteCount ?? 0}
            userUpvoted={userUpvoted}
            contributorRoles={projectWithProfiles.contributor_roles ?? []}
            contributorRequests={projectWithProfiles.contributor_requests ?? []}
            feedbackList={feedbackList ?? []}
            projectPosts={projectWithProfiles.project_posts ?? []}
            projectName={projectWithProfiles.name}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
