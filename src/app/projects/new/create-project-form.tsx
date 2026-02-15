"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ButtonCornerWrapper } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Role = { role: string; count: number };
type LinkItem = { type: "github" | "linkedin" | "peerlist"; url: string };

export function CreateProjectForm({
  categories,
  executionTypes,
}: {
  categories: readonly { value: string; label: string }[];
  executionTypes: readonly { value: string; label: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("open_source");
  const [executionType, setExecutionType] = useState("idea");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roles, setRoles] = useState<Role[]>([{ role: "", count: 1 }]);
  const [links, setLinks] = useState<LinkItem[]>([
    { type: "github", url: "" },
    { type: "linkedin", url: "" },
    { type: "peerlist", url: "" },
  ]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRole = () => setRoles((r) => [...r, { role: "", count: 1 }]);
  const removeRole = (i: number) => setRoles((r) => r.filter((_, idx) => idx !== i));
  const updateRole = (i: number, field: keyof Role, value: string | number) => {
    setRoles((r) =>
      r.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item
      )
    );
  };

  const updateLink = (type: "github" | "linkedin" | "peerlist", url: string) => {
    setLinks((l) =>
      l.map((item) => (item.type === type ? { ...item, url } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      setLoading(false);
      return;
    }

    const validRoles = roles.filter((r) => r.role.trim() && r.count > 0);
    if (validRoles.length === 0) {
      setError("Add at least one contributor role.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        founder_id: user.id,
        name: name.trim(),
        description: description.trim(),
        category,
        status: "open",
        execution_type: executionType,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select("id")
      .single();

    if (insertError || !project) {
      setError("Failed to create project.");
      setLoading(false);
      return;
    }

    let coverUrl: string | null = null;
    let bannerUrl: string | null = null;

    if (coverFile) {
      const ext = coverFile.name.split(".").pop() || "jpg";
      const path = `${project.id}/cover.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-covers")
        .upload(path, coverFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("project-covers")
          .getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }
    }

    if (bannerFile) {
      const ext = bannerFile.name.split(".").pop() || "jpg";
      const path = `${project.id}/banner.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-banners")
        .upload(path, bannerFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("project-banners")
          .getPublicUrl(path);
        bannerUrl = urlData.publicUrl;
      }
    }

    if (coverUrl || bannerUrl) {
      await supabase
        .from("projects")
        .update({
          cover_url: coverUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);
    }

    await supabase.from("contributor_roles").insert(
      validRoles.map((r) => ({
        project_id: project.id,
        role: r.role.trim(),
        count: Number(r.count) || 1,
      }))
    );

    const validLinks = links.filter((l) => l.url.trim());
    if (validLinks.length > 0) {
      await supabase.from("project_links").insert(
        validLinks.map((l) => ({
          project_id: project.id,
          type: l.type,
          url: l.url.trim(),
        }))
      );
    }

    if (executionType === "launched") {
      await supabase.from("products").insert({
        project_id: project.id,
        name: name.trim(),
        url: validLinks.find((l) => l.type === "github")?.url || null,
        activity_summary: null,
      });
    }

    router.push(`/projects/${project.id}`);
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Basic info</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Name</label>
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Description</label>
            <Textarea
              placeholder="Describe your project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Category</label>
            <select
              className="flex h-12 w-full border-2 border-input bg-background px-4 font-inconsolata"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Execution type</label>
            <select
              className="flex h-12 w-full border-2 border-input bg-background px-4 font-inconsolata"
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value)}
            >
              {executionTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-inconsolata text-sm mb-2 block">Start date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="font-inconsolata text-sm mb-2 block">End date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Images</h2>
          <p className="font-inconsolata text-sm text-muted-foreground">
            Cover (boxed) and banner. Project images use rounded corners, distinct from user avatars.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Cover image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Banner image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Contributors needed</h2>
          <p className="font-inconsolata text-sm text-muted-foreground">
            e.g. 2 Designers, 3 Backend devs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.map((r, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="font-inconsolata text-sm mb-1 block">Role</label>
                <Input
                  placeholder="e.g. Designer, Backend dev"
                  value={r.role}
                  onChange={(e) => updateRole(i, "role", e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className="font-inconsolata text-sm mb-1 block">Count</label>
                <Input
                  type="number"
                  min={1}
                  value={r.count}
                  onChange={(e) => updateRole(i, "count", parseInt(e.target.value) || 1)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRole(i)}
                disabled={roles.length === 1}
              >
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addRole}>
            Add role
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Links</h2>
          <p className="font-inconsolata text-sm text-muted-foreground">
            GitHub, LinkedIn, Peerlist
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.map((l) => (
            <div key={l.type}>
              <label className="font-inconsolata text-sm mb-2 block capitalize">
                {l.type} URL
              </label>
              <Input
                type="url"
                placeholder={`https://${l.type}.com/...`}
                value={l.url}
                onChange={(e) => updateLink(l.type, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <p className="font-inconsolata text-sm text-destructive">{error}</p>
      )}

      <ButtonCornerWrapper variant="default">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create project"}
        </Button>
      </ButtonCornerWrapper>
    </form>
  );
}
