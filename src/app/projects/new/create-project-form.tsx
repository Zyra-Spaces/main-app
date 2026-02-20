"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ButtonCornerWrapper } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { rateLimiters } from "@/lib/rate-limit";
import {
  uploadBlobUrlsInBlocks,
  blocksToDescriptionString,
  blocksToPlainTextPreview,
} from "@/lib/project-description-blocks";
import type { Block } from "@blocknote/core";
import { StepBasics } from "./steps/step-basics";
import { StepImages } from "./steps/step-images";
import { StepRoles } from "./steps/step-roles";
import { StepLinks } from "./steps/step-links";
import { StepReview } from "./steps/step-review";
import { DynamicProjectDescriptionEditor } from "@/components/editor/dynamic-project-description-editor";

type Role = { role: string; count: number };
type LinkItem = { type: "github" | "linkedin" | "peerlist"; url: string };

const STEPS = [
  { id: 1, title: "Basics" },
  { id: 2, title: "Images" },
  { id: 3, title: "Description" },
  { id: 4, title: "Roles" },
  { id: 5, title: "Links" },
  { id: 6, title: "Review" },
] as const;

export function CreateProjectForm({
  categories,
  executionTypes,
}: {
  categories: readonly { value: string; label: string }[];
  executionTypes: readonly { value: string; label: string }[];
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [descriptionBlocks, setDescriptionBlocks] = useState<Block[]>([]);
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
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageLimitWarning, setImageLimitWarning] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreview(null);
  }, [coverFile]);

  useEffect(() => {
    if (bannerFile) {
      const url = URL.createObjectURL(bannerFile);
      setBannerPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setBannerPreview(null);
  }, [bannerFile]);

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

  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("Project name is required.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      const hasContent =
        descriptionBlocks.length > 0 &&
        descriptionBlocks.some(
          (b) =>
            (b.content?.length && (b.content as { text?: string }[]).some((c) => (c as { text?: string }).text?.trim())) ||
            b.type === "image"
        );
      if (!hasContent) {
        setError("Add at least some description content.");
        return false;
      }
      return true;
    }
    if (step === 4) {
      const validRoles = roles.filter((r) => r.role.trim() && r.count > 0);
      if (validRoles.length === 0) {
        setError("Add at least one contributor role.");
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, 6));
  };

  const goBack = () => {
    setError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const hasDescriptionContent =
    descriptionBlocks.length > 0 &&
    descriptionBlocks.some(
      (b) =>
        (b.content?.length && (b.content as { text?: string }[]).some((c) => (c as { text?: string }).text?.trim())) ||
        b.type === "image"
    );

  const submit = async (asDraft: boolean) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setImageLimitWarning(null);
    setWarningMessage(null);

    const sanitizedName = name.trim().slice(0, 100).replace(/<[^>]*>/g, "");
    if (!sanitizedName) {
      setError("Project name is required.");
      setLoading(false);
      return;
    }
    if (!asDraft && !hasDescriptionContent) {
      setError("Description is required to publish.");
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

    if (!asDraft) {
      const identifier = `project-creation:${user.id}`;
      const limitResult = rateLimiters.projectCreation(identifier);
      if (!limitResult.success) {
        setWarningMessage("Too many projects created. Please wait before creating another.");
        setLoading(false);
        return;
      }
    }

    const status = asDraft ? "draft" : "open";
    const placeholderDescription = "[]";
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        founder_id: user.id,
        name: sanitizedName,
        description: placeholderDescription,
        category,
        status,
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

    let finalBlocks = descriptionBlocks;
    if (descriptionBlocks.length > 0) {
      try {
        finalBlocks = await uploadBlobUrlsInBlocks(
          supabase,
          project.id,
          descriptionBlocks
        );
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
    }
    const descriptionJson = blocksToDescriptionString(finalBlocks);
    await supabase
      .from("projects")
      .update({
        description: descriptionJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

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

    if (executionType === "launched" && !asDraft) {
      await supabase.from("products").insert({
        project_id: project.id,
        name: name.trim(),
        url: validLinks.find((l) => l.type === "github")?.url || null,
        activity_summary: null,
      });
    }

    setLoading(false);
    if (asDraft) {
      setSuccessMessage("Draft saved.");
      router.push(`/projects/${project.id}/edit`);
      router.refresh();
    } else {
      setSuccessMessage("Project published.");
      router.push(`/projects/${project.id}`);
      router.refresh();
    }
  };

  const categoryLabel =
    categories.find((c) => c.value === category)?.label ?? category;
  const executionTypeLabel =
    executionTypes.find((t) => t.value === executionType)?.label ?? executionType;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentStep(s.id)}
            className={`font-inconsolata text-sm px-2 py-1 transition-colors ${
              currentStep === s.id
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">
            {STEPS[currentStep - 1].title}
          </h2>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <StepBasics
              name={name}
              setName={setName}
              category={category}
              setCategory={setCategory}
              executionType={executionType}
              setExecutionType={setExecutionType}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              categories={categories}
              executionTypes={executionTypes}
            />
          )}
          {currentStep === 2 && (
            <StepImages
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              bannerFile={bannerFile}
              setBannerFile={setBannerFile}
              coverPreview={coverPreview}
              bannerPreview={bannerPreview}
            />
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="font-inconsolata text-sm text-muted-foreground">
                Use the editor below. Type / for slash commands. You can add
                headings, lists, images (paste or /image), and links. Max 5
                images per project (cover + banner + 3 in description).
              </p>
              <div className="min-h-[280px] border border-input rounded-none">
                <DynamicProjectDescriptionEditor
                  initialContent={
                    descriptionBlocks.length > 0 ? descriptionBlocks : undefined
                  }
                  onChange={setDescriptionBlocks}
                  projectId={null}
                  coverCount={coverFile ? 1 : 0}
                  bannerCount={bannerFile ? 1 : 0}
                  onImageLimitReached={() =>
                    setImageLimitWarning("Maximum 5 images per project.")
                  }
                  className="[&_.bn-editor]:min-h-[260px]"
                />
              </div>
              {imageLimitWarning && (
                <p className="font-inconsolata text-sm text-warning">
                  {imageLimitWarning}
                </p>
              )}
            </div>
          )}
          {currentStep === 4 && (
            <StepRoles
              roles={roles}
              addRole={addRole}
              removeRole={removeRole}
              updateRole={updateRole}
            />
          )}
          {currentStep === 5 && (
            <StepLinks links={links} updateLink={updateLink} />
          )}
          {currentStep === 6 && (
            <StepReview
              name={name}
              categoryLabel={categoryLabel}
              executionTypeLabel={executionTypeLabel}
              startDate={startDate}
              endDate={endDate}
              description={
                descriptionBlocks.length
                  ? blocksToPlainTextPreview(descriptionBlocks)
                  : ""
              }
              roles={roles}
              links={links}
              hasCover={!!coverFile}
              hasBanner={!!bannerFile}
            />
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="font-inconsolata text-sm text-destructive">{error}</p>
      )}
      {warningMessage && (
        <p className="font-inconsolata text-sm text-warning">{warningMessage}</p>
      )}
      {successMessage && (
        <p className="font-inconsolata text-sm text-success">{successMessage}</p>
      )}

      <div className="flex items-center gap-3">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
        )}
        {currentStep < 6 ? (
          <Button type="button" onClick={goNext}>
            Next
          </Button>
        ) : (
          <>
            <ButtonCornerWrapper variant="default">
              <Button
                type="button"
                disabled={loading}
                onClick={() => submit(true)}
              >
                {loading ? "Saving..." : "Save as draft"}
              </Button>
            </ButtonCornerWrapper>
            <ButtonCornerWrapper variant="default">
              <Button
                type="button"
                disabled={loading}
                onClick={() => submit(false)}
              >
                {loading ? "Publishing..." : "Publish"}
              </Button>
            </ButtonCornerWrapper>
          </>
        )}
      </div>
    </div>
  );
}
