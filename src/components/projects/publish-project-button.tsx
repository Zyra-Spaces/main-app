"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishProject } from "@/app/projects/[id]/actions";

export function PublishProjectButton({
  projectId,
  variant = "default",
  size = "default",
  className,
  children = "Publish",
}: {
  projectId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    const result = await publishProject(projectId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    router.push(`/projects/${projectId}`);
  };

  return (
    <span className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handlePublish}
        disabled={loading}
      >
        {loading ? "Publishing…" : children}
      </Button>
      {error && (
        <span className="font-inconsolata text-sm text-destructive ml-2">
          {error}
        </span>
      )}
    </span>
  );
}
