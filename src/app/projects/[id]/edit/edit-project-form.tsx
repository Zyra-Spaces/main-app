"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonCornerWrapper } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PREDEFINED_PROJECT_ROLES } from "@/lib/project-roles";
import {
  parseDescriptionToBlocks,
  legacyPlainTextToBlocks,
  blocksToDescriptionString,
  uploadBlobUrlsInBlocks,
} from "@/lib/project-description-blocks";
import type { Block } from "@blocknote/core";
import { DynamicProjectDescriptionEditor } from "@/components/editor/dynamic-project-description-editor";

type Role = { role: string; count: number };
type LinkItem = { type: "github" | "linkedin" | "peerlist"; url: string };

type Initial = {
  name: string;
  description: string;
  category: string;
  status: string;
  executionType: string;
  startDate: string;
  endDate: string;
  coverUrl: string | null;
  bannerUrl: string | null;
  roles: Role[];
  links: LinkItem[];
};

export function EditProjectForm({
  projectId,
  initial,
  categories,
  executionTypes,
  statusOptions,
}: {
  projectId: string;
  initial: Initial;
  categories: readonly { value: string; label: string }[];
  executionTypes: readonly { value: string; label: string }[];
  statusOptions: readonly { value: string; label: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [status, setStatus] = useState(initial.status);
  const [executionType, setExecutionType] = useState(initial.executionType);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [roles, setRoles] = useState<Role[]>(initial.roles);
  const [links, setLinks] = useState<LinkItem[]>(initial.links);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageLimitWarning, setImageLimitWarning] = useState<string | null>(null);

  const initialBlocks = useMemo(() => {
    const parsed = parseDescriptionToBlocks(initial.description);
    return parsed ?? legacyPlainTextToBlocks(initial.description || "");
  }, [initial.description]);

  const [descriptionBlocks, setDescriptionBlocks] = useState<Block[]>(initialBlocks);

  const addRole = () => setRoles((r) => [...r, { role: "", count: 1 }]);
  const removeRole = (i: number) => setRoles((r) => r.filter((_, idx) => idx !== i));
  const updateRole = (i: number, field: keyof Role, value: string | number) => {
    setRoles((r) =>
      r.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  };

  const updateLink = (type: "github" | "linkedin" | "peerlist", url: string) => {
    setLinks((l) =>
      l.map((item) => (item.type === type ? { ...item, url } : item))
    );
  };

  const hasDescriptionContent =
    descriptionBlocks.length > 0 &&
    descriptionBlocks.some(
      (b) =>
        (b.content?.length && (b.content as { text?: string }[]).some((c) => (c as { text?: string }).text?.trim())) ||
        b.type === "image"
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    setImageLimitWarning(null);

    if (!name.trim()) {
      setError("Name is required.");
      setLoading(false);
      return;
    }
    if (!hasDescriptionContent) {
      setError("Description is required.");
      setLoading(false);
      return;
    }

    const sanitizedName = name.trim().slice(0, 100).replace(/<[^>]*>/g, "");

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

    // Images: files go to Supabase Storage (project-covers / project-banners buckets);
    // the public URLs are then saved to projects.cover_url and projects.banner_url.
    let coverUrl: string | null = initial.coverUrl;
    let bannerUrl: string | null = initial.bannerUrl;

    if (coverFile) {
      const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${projectId}/cover.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-covers")
        .upload(path, coverFile, { upsert: true });
      if (uploadErr) {
        setError(`Cover image upload failed: ${uploadErr.message}`);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("project-covers")
        .getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    if (bannerFile) {
      const ext = bannerFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${projectId}/banner.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-banners")
        .upload(path, bannerFile, { upsert: true });
      if (uploadErr) {
        setError(`Banner image upload failed: ${uploadErr.message}`);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("project-banners")
        .getPublicUrl(path);
      bannerUrl = urlData.publicUrl;
    }

    let finalBlocks = descriptionBlocks;
    try {
      finalBlocks = await uploadBlobUrlsInBlocks(supabase, projectId, descriptionBlocks);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to upload description images.";
      setError(
        message.includes("Bucket not found") || message.includes("not found")
          ? "Description images bucket is missing. Run the Supabase migration (00003_project_description_images_bucket.sql) or create the bucket 'project-description-images' in the Supabase dashboard."
          : `Failed to upload description images: ${message}`
      );
      setLoading(false);
      return;
    }
    const descriptionJson = blocksToDescriptionString(finalBlocks);

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        name: sanitizedName,
        description: descriptionJson,
        category,
        status,
        execution_type: executionType,
        start_date: startDate || null,
        end_date: endDate || null,
        cover_url: coverUrl,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("founder_id", user.id);

    if (updateError) {
      setError(`Failed to update project: ${updateError.message}`);
      setLoading(false);
      return;
    }

    const { error: rolesDeleteErr } = await supabase
      .from("contributor_roles")
      .delete()
      .eq("project_id", projectId);
    if (rolesDeleteErr) {
      setError(`Failed to update roles: ${rolesDeleteErr.message}`);
      setLoading(false);
      return;
    }
    const { error: rolesInsertErr } = await supabase.from("contributor_roles").insert(
      validRoles.map((r) => ({
        project_id: projectId,
        role: r.role.trim(),
        count: Number(r.count) || 1,
      }))
    );
    if (rolesInsertErr) {
      setError(`Failed to save roles: ${rolesInsertErr.message}`);
      setLoading(false);
      return;
    }

    const { error: linksDeleteErr } = await supabase
      .from("project_links")
      .delete()
      .eq("project_id", projectId);
    if (linksDeleteErr) {
      setError(`Failed to update links: ${linksDeleteErr.message}`);
      setLoading(false);
      return;
    }
    const validLinks = links.filter((l) => l.url.trim());
    if (validLinks.length > 0) {
      const { error: linksInsertErr } = await supabase.from("project_links").insert(
        validLinks.map((l) => ({
          project_id: projectId,
          type: l.type,
          url: l.url.trim(),
        }))
      );
      if (linksInsertErr) {
        setError(`Failed to save links: ${linksInsertErr.message}`);
        setLoading(false);
        return;
      }
    }

    setSaved(true);
    setLoading(false);
    router.refresh();
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
            <div className="min-h-[200px] border border-input rounded-none">
              <DynamicProjectDescriptionEditor
                initialContent={descriptionBlocks.length > 0 ? descriptionBlocks : undefined}
                onChange={setDescriptionBlocks}
                projectId={projectId}
                coverCount={coverFile || initial.coverUrl ? 1 : 0}
                bannerCount={bannerFile || initial.bannerUrl ? 1 : 0}
                onImageLimitReached={() =>
                  setImageLimitWarning("Maximum 5 images per project.")
                }
                className="[&_.bn-editor]:min-h-[180px]"
              />
            </div>
            {imageLimitWarning && (
              <p className="font-inconsolata text-sm text-warning mt-1">
                {imageLimitWarning}
              </p>
            )}
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Category</label>
            <Select
              options={categories.map((c) => ({ value: c.value, label: c.label }))}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Status</label>
            <Select
              options={statusOptions.map((s) => ({ value: s.value, label: s.label }))}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Execution type</label>
            <Select
              options={executionTypes.map((t) => ({ value: t.value, label: t.label }))}
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value)}
            />
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
            Upload new images to replace existing cover or banner. Leave empty to keep current.
            Files are saved to Supabase Storage (project-covers / project-banners); URLs are stored on the project.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Cover image (optional)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className="font-inconsolata text-sm mb-2 block">Banner image (optional)</label>
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
            Select a role and number of spots. Keeps tracking consistent.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const predefinedValues = new Set(PREDEFINED_PROJECT_ROLES.map((o) => o.value));
            const legacyOptions = roles
              .filter((r) => r.role && !predefinedValues.has(r.role))
              .map((r) => ({ value: r.role, label: r.role }));
            const uniqueLegacy = Array.from(
              new Map(legacyOptions.map((o) => [o.value, o])).values()
            );
            const roleOptions = [...PREDEFINED_PROJECT_ROLES, ...uniqueLegacy];
            return roles.map((r, i) => (
              <div key={i} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="font-inconsolata text-sm mb-1 block">Role</label>
                  <Select
                    placeholder="Select role"
                    options={roleOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                    value={r.role}
                    onChange={(e) => updateRole(i, "role", e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label className="font-inconsolata text-sm mb-1 block">Spots</label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
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
            ));
          })()}
          <Button type="button" variant="outline" onClick={addRole}>
            Add role
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Links</h2>
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
      {saved && (
        <p className="font-inconsolata text-sm text-success">Project saved.</p>
      )}

      <div className="flex gap-4">
        <ButtonCornerWrapper variant="default">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </ButtonCornerWrapper>
        <ButtonCornerWrapper variant="outline">
          <Link
            href={`/projects/${projectId}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancel
          </Link>
        </ButtonCornerWrapper>
      </div>
    </form>
  );
}
