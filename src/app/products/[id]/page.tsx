import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      projects(id, name, description, cover_url, banner_url, founder_id, category)
    `)
    .eq("id", id)
    .single();

  if (!product) notFound();

  const project = product.projects as {
    id: string;
    name: string;
    description: string;
    cover_url: string | null;
    banner_url: string | null;
    founder_id: string;
    category: string;
  } | null;

  const activitySummary = product.activity_summary as Record<string, unknown> | null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-12 lg:px-[140px]">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="shrink-0">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-muted border-2 border-border">
                {project?.cover_url ? (
                  <Image
                    src={project.cover_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground text-xs">
                    —
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-geist-pixel text-3xl font-bold">{product.name}</h1>
              <p className="font-inconsolata text-muted-foreground mt-2">
                Launched product
              </p>
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-inconsolata text-sm text-foreground hover:underline mt-4 inline-block"
                >
                  {product.url}
                </a>
              )}
              <Link
                href={`/projects/${project?.id}`}
                className="font-inconsolata text-sm text-muted-foreground hover:text-foreground mt-4 inline-block"
              >
                View project page →
              </Link>
            </div>
          </div>

          {project && (
            <div className="mt-8">
              <h2 className="font-nunito text-lg font-semibold mb-2">About</h2>
              <p className="font-inconsolata text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          )}

          {activitySummary && Object.keys(activitySummary).length > 0 && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <h2 className="font-nunito text-lg font-semibold mb-4">
                  Activity during project phase
                </h2>
                <pre className="font-inconsolata text-sm text-muted-foreground overflow-x-auto">
                  {JSON.stringify(activitySummary, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {!activitySummary && (
            <p className="font-inconsolata text-sm text-muted-foreground mt-8">
              Activity summary will appear here once the project phase data is added.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
