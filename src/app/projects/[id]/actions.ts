"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function publishProject(projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, status, founder_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) return { error: "Project not found." };
  if (project.founder_id !== user.id) return { error: "Not the project founder." };
  if (project.status !== "draft") return { error: "Project is not a draft." };

  const { error: updateError } = await supabase
    .from("projects")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("founder_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/edit`);
  return {};
}
