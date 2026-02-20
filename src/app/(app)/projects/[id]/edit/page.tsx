import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditProjectForm } from "@/app/projects/[id]/edit/edit-project-form";
import { PublishProjectButton } from "@/components/projects/publish-project-button";

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

  const isDraft = project.status === "draft";

  return (
    <div className="flex-1 min-h-0">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        {isDraft && (
          <div className="mb-6 p-4 border border-warning/50 bg-warning/10 rounded flex flex-wrap items-center justify-between gap-3">
            <p className="font-inconsolata text-sm text-foreground">
              This project is a draft. It’s only visible to you. Publish it to make it visible to others.
            </p>
            <PublishProjectButton projectId={id} variant="default" size="sm">
              Publish project
            </PublishProjectButton>
          </div>
        )}
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
    </div>
  );
}
