import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EditProjectForm } from "./edit-project-form";

const CATEGORIES = [
  { value: "open_source", label: "Open Source" },
  { value: "startup", label: "Startup" },
  { value: "side_project", label: "Side Project" },
  { value: "hackathon", label: "Hackathon" },
  { value: "community", label: "Community" },
] as const;

const EXECUTION_TYPES = [
  { value: "idea", label: "Idea" },
  { value: "building", label: "Building" },
  { value: "launched", label: "Launched" },
] as const;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "closed", label: "Closed" },
] as const;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/projects/" + id + "/edit");

  const { data: project } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      category,
      status,
      execution_type,
      start_date,
      end_date,
      cover_url,
      banner_url,
      founder_id,
      contributor_roles(role, count),
      project_links(type, url)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!project || project.founder_id !== user.id) {
    notFound();
  }

  const roles = (project.contributor_roles ?? []).map((r: { role: string; count: number }) => ({
    role: r.role,
    count: r.count,
  }));
  const links = [
    { type: "github" as const, url: (project.project_links ?? []).find((l: { type: string }) => l.type === "github")?.url ?? "" },
    { type: "linkedin" as const, url: (project.project_links ?? []).find((l: { type: string }) => l.type === "linkedin")?.url ?? "" },
    { type: "peerlist" as const, url: (project.project_links ?? []).find((l: { type: string }) => l.type === "peerlist")?.url ?? "" },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-6 sm:px-12 lg:px-[140px]">
          <h1 className="font-geist-pixel text-3xl font-bold mb-2">
            Edit project
          </h1>
          <p className="font-inconsolata text-muted-foreground mb-8">
            Update your project details and roles.
          </p>
          <EditProjectForm
            projectId={id}
            initial={{
              name: project.name,
              description: project.description,
              category: project.category,
              status: project.status,
              executionType: project.execution_type,
              startDate: project.start_date ?? "",
              endDate: project.end_date ?? "",
              coverUrl: project.cover_url,
              bannerUrl: project.banner_url,
              roles: roles.length > 0 ? roles : [{ role: "", count: 1 }],
              links,
            }}
            categories={CATEGORIES}
            executionTypes={EXECUTION_TYPES}
            statusOptions={STATUS_OPTIONS}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
