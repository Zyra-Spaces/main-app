import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: qualifications } = await supabase
    .from("qualifications")
    .select("*")
    .eq("user_id", id);

  const { data: foundedProjects } = await supabase
    .from("projects")
    .select("id, name, category")
    .eq("founder_id", id)
    .neq("status", "draft");

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, projects(id, name, category)")
    .eq("user_id", id)
    .eq("status", "approved");

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-3xl px-6 sm:px-12 lg:px-[140px]">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
              <AvatarFallback>
                {(profile.full_name ?? profile.email ?? "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-geist-pixel text-2xl font-bold">
                {profile.full_name ?? profile.email ?? "User"}
              </h1>
              {profile.email && (
                <p className="font-inconsolata text-muted-foreground text-sm mt-1">
                  {profile.email}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-inconsolata text-sm text-muted-foreground hover:text-foreground"
                  >
                    GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-inconsolata text-sm text-muted-foreground hover:text-foreground"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.peerlist_url && (
                  <a
                    href={profile.peerlist_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-inconsolata text-sm text-muted-foreground hover:text-foreground"
                  >
                    Peerlist
                  </a>
                )}
              </div>
            </div>
          </div>

          {qualifications && qualifications.length > 0 && (
            <div className="mt-10">
              <h2 className="font-nunito text-lg font-semibold mb-2">Qualifications</h2>
              <div className="flex flex-wrap gap-2">
                {qualifications.map((q) => (
                  <Badge key={q.id} variant="secondary">
                    {q.skill} ({q.level})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-nunito text-lg font-semibold mb-4">Projects founded</h2>
              {foundedProjects?.length ? (
                <ul className="space-y-2">
                  {foundedProjects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-inconsolata text-sm text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {p.category}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-inconsolata text-sm text-muted-foreground">
                  No projects yet.
                </p>
              )}
            </div>
            <div>
              <h2 className="font-nunito text-lg font-semibold mb-4">Contributions</h2>
              {memberships?.length ? (
                <ul className="space-y-2">
                  {memberships.map((m) => {
                    const p = m.projects as unknown as { id: string; name: string; category: string } | null;
                    if (!p) return null;
                    return (
                      <li key={m.project_id}>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-inconsolata text-sm text-foreground hover:underline"
                        >
                          {p.name}
                        </Link>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {p.category}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="font-inconsolata text-sm text-muted-foreground">
                  No contributions yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
