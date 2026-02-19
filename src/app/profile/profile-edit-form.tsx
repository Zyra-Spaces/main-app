"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ButtonCornerWrapper } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Qualification = { id?: string; skill: string; level: string };
type Profile = {
  full_name?: string | null;
  avatar_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  peerlist_url?: string | null;
} | null;

export function ProfileEditForm({
  userId,
  profile,
  qualifications: initial,
}: {
  userId: string;
  profile: Profile;
  qualifications: Qualification[];
}) {
  const [qualifications, setQualifications] = useState<Qualification[]>(
    initial.length > 0 ? initial : [{ skill: "", level: "" }]
  );
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [githubUrl, setGithubUrl] = useState(profile?.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? "");
  const [peerlistUrl, setPeerlistUrl] = useState(profile?.peerlist_url ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);

    const validQualifications = qualifications.filter((q) => q.skill.trim());
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || profile?.full_name || null,
        avatar_url: avatarUrl.trim() || profile?.avatar_url || null,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        peerlist_url: peerlistUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    await supabase.from("qualifications").delete().eq("user_id", userId);

    if (validQualifications.length > 0) {
      await supabase.from("qualifications").insert(
        validQualifications.map((q) => ({
          user_id: userId,
          skill: q.skill.trim(),
          level: q.level.trim() || "intermediate",
        }))
      );
    }

    setLoading(false);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Edit profile</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Display name</label>
            <Input
              placeholder="Your name (from Google if you signed up with Google)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <p className="font-inconsolata text-xs text-muted-foreground mt-1">
              Override the name from your login. Leave blank to keep current.
            </p>
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Profile picture URL</label>
            <Input
              type="url"
              placeholder="https://... (from Google/GitHub or your own image URL)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="font-inconsolata text-xs text-muted-foreground mt-1">
              Override your avatar. Leave blank to keep current (e.g. Google profile photo).
            </p>
          </div>
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-inconsolata text-sm">Qualifications</label>
              <Button type="button" variant="ghost" size="sm" onClick={addQualification}>
                Add
              </Button>
            </div>
            {qualifications.map((q, i) => (
              <div key={i} className="flex gap-3 items-end">
                <Input
                  placeholder="Skill"
                  value={q.skill}
                  onChange={(e) => updateQualification(i, "skill", e.target.value)}
                  className="flex-1"
                />
                <select
                  className="flex h-12 w-32 border-2 border-input bg-background px-4 font-inconsolata"
                  value={q.level}
                  onChange={(e) => updateQualification(i, "level", e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQualification(i)}
                  disabled={qualifications.length === 1}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <ButtonCornerWrapper variant="default">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </ButtonCornerWrapper>
          {saved && (
            <p className="font-inconsolata text-sm text-muted-foreground">
              Profile saved.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
