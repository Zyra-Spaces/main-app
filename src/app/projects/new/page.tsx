import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CreateProjectForm } from "./create-project-form";

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

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/projects/new");

  const { data: qualifications } = await supabase
    .from("qualifications")
    .select("*")
    .eq("user_id", user.id);
  if (!qualifications || qualifications.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-6 sm:px-12 lg:px-[140px]">
          <h1 className="font-geist-pixel text-3xl font-bold mb-2">
            Start a project
          </h1>
          <p className="font-inconsolata text-muted-foreground mb-8">
            Add your project details and the roles you need.
          </p>
          <CreateProjectForm
            categories={CATEGORIES}
            executionTypes={EXECUTION_TYPES}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
