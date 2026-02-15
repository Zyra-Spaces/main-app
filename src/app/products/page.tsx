import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      project_id,
      name,
      url,
      activity_summary,
      created_at,
      projects(id, name, description, cover_url, founder_id)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-12 lg:px-[140px]">
          <h1 className="font-geist-pixel text-3xl font-bold mb-8">Products</h1>
          <p className="font-inconsolata text-muted-foreground mb-8">
            Launched projects with links and activity from the project phase.
          </p>
          <div className="space-y-6">
            {products?.length === 0 ? (
              <p className="font-inconsolata text-muted-foreground">
                No products yet. Launch a project to see it here.
              </p>
            ) : (
              products?.map((product) => {
                const project = product.projects as unknown as { id: string; name: string; description: string; cover_url: string | null } | null;
                return (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="overflow-hidden hover:border-muted-foreground/30 transition-colors">
                      <div className="flex gap-6 p-6">
                        <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-muted">
                          {project?.cover_url ? (
                            <Image
                              src={project.cover_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="96px"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground text-xs">
                              —
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-nunito text-lg font-semibold">
                            {product.name}
                          </h2>
                          {project && (
                            <p className="font-inconsolata text-sm text-muted-foreground line-clamp-2 mt-1">
                              {project.description}
                            </p>
                          )}
                          {product.url && (
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-inconsolata text-sm text-muted-foreground hover:text-foreground mt-2 inline-block"
                            >
                              View product →
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
