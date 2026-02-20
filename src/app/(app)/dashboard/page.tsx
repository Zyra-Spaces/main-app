import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardProjectCard } from "@/components/dashboard/dashboard-project-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: foundedProjects } = await supabase
    .from("projects")
    .select("id, name, category, status, cover_url, execution_type, founder_id, updated_at")
    .eq("founder_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("status", "approved");
  const contributedProjectIds = (memberRows ?? [])
    .map((r) => r.project_id)
    .filter((id) => !(foundedProjects ?? []).some((p) => p.id === id));

  const { data: contributedProjects } =
    contributedProjectIds.length > 0
      ? await supabase
          .from("projects")
          .select("id, name, category, status, cover_url, execution_type, founder_id, updated_at")
          .in("id", contributedProjectIds)
          .is("deleted_at", null)
          .neq("status", "draft")
          .order("updated_at", { ascending: false })
      : { data: [] };

  const projects = [
    ...(foundedProjects ?? []),
    ...(contributedProjects ?? []),
  ].sort(
    (a, b) =>
      new Date((b as { updated_at?: string }).updated_at ?? 0).getTime() -
      new Date((a as { updated_at?: string }).updated_at ?? 0).getTime()
  );

  const projectIds = projects.map((p) => p.id);

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      url,
      project_id,
      projects(id, name, cover_url)
    `)
    .in("project_id", projectIds);

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="font-geist-pixel text-3xl font-bold mb-8">Dashboard</h1>
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="rounded">
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="products">My Products</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-6">
            <div className="space-y-4">
              {projects?.length === 0 ? (
                <p className="font-inconsolata text-muted-foreground">
                  No projects yet.{" "}
                  <Link href="/projects/new" className="text-foreground hover:underline">
                    Start one
                  </Link>
                </p>
              ) : (
                projects?.map((p) => (
                  <DashboardProjectCard
                    key={p.id}
                    project={{
                      id: p.id,
                      name: p.name,
                      category: (p as { category?: string }).category ?? "",
                      status: (p as { status?: string }).status ?? "",
                      cover_url: p.cover_url,
                      execution_type: (p as { execution_type?: string }).execution_type ?? "",
                      founder_id: (p as { founder_id?: string }).founder_id ?? "",
                      updated_at: (p as { updated_at?: string }).updated_at ?? "",
                    }}
                    currentUserId={user.id}
                  />
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="products" className="mt-6">
            <div className="space-y-4">
              {products?.length === 0 ? (
                <p className="font-inconsolata text-muted-foreground">
                  No launched products yet. Launch a project to see it here.
                </p>
              ) : (
                products?.map((prod) => {
                  const proj = prod.projects as unknown as { id: string; name: string; cover_url: string | null } | null;
                  return (
                    <Link key={prod.id} href={`/products/${prod.id}`}>
                      <Card className="overflow-hidden hover:border-muted-foreground/30 transition-colors rounded">
                        <div className="flex gap-4 p-6">
                          <div className="relative w-20 h-20 shrink-0 rounded overflow-hidden bg-muted">
                            {proj?.cover_url ? (
                              <Image
                                src={proj.cover_url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="80px"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground text-xs">
                                —
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-nunito font-semibold">{prod.name}</h2>
                            {prod.url && (
                              <a
                                href={prod.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="font-inconsolata text-sm text-muted-foreground hover:text-foreground"
                              >
                                {prod.url}
                              </a>
                            )}
                          </div>
                          <span className="font-inconsolata text-sm text-muted-foreground self-center">
                            View →
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
