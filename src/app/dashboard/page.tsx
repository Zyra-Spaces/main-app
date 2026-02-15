import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, category, status, cover_url, execution_type")
    .eq("founder_id", user.id)
    .neq("status", "draft")
    .order("updated_at", { ascending: false });

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      url,
      project_id,
      projects(id, name, cover_url)
    `)
    .in(
      "project_id",
      (projects ?? []).map((p) => p.id)
    );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-12 lg:px-[140px]">
          <h1 className="font-geist-pixel text-3xl font-bold mb-8">Dashboard</h1>
          <Tabs defaultValue="projects" className="w-full">
            <TabsList>
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
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <Card className="overflow-hidden hover:border-muted-foreground/30 transition-colors">
                        <div className="flex gap-4 p-6">
                          <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                            {p.cover_url ? (
                              <Image
                                src={p.cover_url}
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
                            <h2 className="font-nunito font-semibold">{p.name}</h2>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{p.category}</Badge>
                              <Badge variant="secondary">{p.status}</Badge>
                              <Badge variant="secondary">{p.execution_type}</Badge>
                            </div>
                          </div>
                          <span className="font-inconsolata text-sm text-muted-foreground self-center">
                            View →
                          </span>
                        </div>
                      </Card>
                    </Link>
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
                        <Card className="overflow-hidden hover:border-muted-foreground/30 transition-colors">
                          <div className="flex gap-4 p-6">
                            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
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
      </main>
      <Footer />
    </div>
  );
}
