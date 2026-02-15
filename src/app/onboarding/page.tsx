import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: qualifications } = await supabase
    .from("qualifications")
    .select("*")
    .eq("user_id", user.id);

  const hasQualifications = qualifications && qualifications.length > 0;
  if (hasQualifications && profile?.github_url) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen py-24 px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-geist-pixel text-3xl font-bold mb-2">
          Complete your profile
        </h1>
        <p className="font-inconsolata text-muted-foreground mb-8">
          Add your skills and links so we can recommend the right projects.
        </p>
        <OnboardingForm
          userId={user.id}
          profile={profile}
          qualifications={qualifications ?? []}
        />
      </div>
    </div>
  );
}
