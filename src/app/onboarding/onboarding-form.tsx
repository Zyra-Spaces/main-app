"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ButtonCornerWrapper } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Qualification = { id?: string; skill: string; level: string };
type Profile = { github_url?: string | null; linkedin_url?: string | null; peerlist_url?: string | null } | null;

export function OnboardingForm({
  userId,
  profile,
  qualifications: initial,
}: {
  userId: string;
  profile: Profile;
  qualifications: Qualification[];
}) {
  const router = useRouter();
  const [qualifications, setQualifications] = useState<Qualification[]>(
    initial.length > 0 ? initial : [{ skill: "", level: "" }]
  );
  const [githubUrl, setGithubUrl] = useState(profile?.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? "");
  const [peerlistUrl, setPeerlistUrl] = useState(profile?.peerlist_url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQualification = () => {
    setQualifications((q) => [...q, { skill: "", level: "" }]);
  };

  const removeQualification = (i: number) => {
    setQualifications((q) => q.filter((_, idx) => idx !== i));
  };

  const updateQualification = (i: number, field: "skill" | "level", value: string) => {
    setQualifications((q) =>
      q.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validQualifications = qualifications.filter((q) => q.skill.trim());
    if (validQualifications.length === 0) {
      setError("Add at least one skill.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        peerlist_url: peerlistUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      setError("Failed to update profile.");
      setLoading(false);
      return;
    }

    await supabase.from("qualifications").delete().eq("user_id", userId);

    if (validQualifications.length > 0) {
      const { error: qualError } = await supabase.from("qualifications").insert(
        validQualifications.map((q) => ({
          user_id: userId,
          skill: q.skill.trim(),
          level: q.level.trim() || "intermediate",
        }))
      );

      if (qualError) {
        setError("Failed to save qualifications.");
        setLoading(false);
        return;
      }
    }

    router.push("/feed");
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Links</h2>
          <p className="font-inconsolata text-sm text-muted-foreground">
            GitHub, LinkedIn, and Peerlist (optional)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-inconsolata text-sm mb-2 block">GitHub URL</label>
            <Input
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">LinkedIn URL</label>
            <Input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Peerlist URL</label>
            <Input
              type="url"
              placeholder="https://peerlist.io/username"
              value={peerlistUrl}
              onChange={(e) => setPeerlistUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Qualifications</h2>
          <p className="font-inconsolata text-sm text-muted-foreground">
            Skills and experience level
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {qualifications.map((q, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="font-inconsolata text-sm mb-1 block">Skill</label>
                <Input
                  placeholder="e.g. React, Node.js, UI Design"
                  value={q.skill}
                  onChange={(e) => updateQualification(i, "skill", e.target.value)}
                />
              </div>
              <div className="w-36">
                <label className="font-inconsolata text-sm mb-1 block">Level</label>
                <select
                  className="flex h-12 w-full border-2 border-input bg-background px-4 py-2 font-inconsolata text-base"
                  value={q.level}
                  onChange={(e) => updateQualification(i, "level", e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQualification(i)}
                disabled={qualifications.length === 1}
              >
                <span className="text-destructive">×</span>
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addQualification}>
            Add skill
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="font-inconsolata text-sm text-destructive">{error}</p>
      )}

      <ButtonCornerWrapper variant="default">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </ButtonCornerWrapper>
    </form>
  );
}
