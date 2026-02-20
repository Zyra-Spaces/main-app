"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublishProjectButton } from "@/components/projects/publish-project-button";

type Project = {
  id: string;
  name: string;
  category: string;
  status: string;
  cover_url: string | null;
  execution_type: string;
  founder_id: string;
  updated_at: string;
};

export function DashboardProjectCard({
  project,
  currentUserId,
}: {
  project: Project;
  currentUserId: string;
}) {
  const isFounder = project.founder_id === currentUserId;
  const isDraft = project.status === "draft";
  const href = isDraft && isFounder ? `/projects/${project.id}/edit` : `/projects/${project.id}`;

  return (
    <Card className="overflow-hidden hover:border-muted-foreground/30 transition-colors rounded">
      <div className="flex gap-4 p-6 items-center">
        <Link href={href} className="flex gap-4 flex-1 min-w-0">
          <div className="relative w-20 h-20 shrink-0 rounded overflow-hidden bg-muted">
            {project.cover_url ? (
              <Image
                src={project.cover_url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground text-xs">
                —
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-nunito font-semibold">{project.name}</h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge variant={isFounder ? "default" : "outline"}>
                {isFounder ? "Founder" : "Contributor"}
              </Badge>
              <Badge variant="outline">{project.category}</Badge>
              {isDraft ? (
                <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10">
                  Draft
                </Badge>
              ) : (
                <Badge variant="secondary">{project.status}</Badge>
              )}
              <Badge variant="secondary">{project.execution_type}</Badge>
            </div>
          </div>
          <span className="font-inconsolata text-sm text-muted-foreground self-center shrink-0">
            {isDraft && isFounder ? "Edit →" : "View →"}
          </span>
        </Link>
        {isDraft && isFounder && (
          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
            <PublishProjectButton projectId={project.id} variant="default" size="sm" />
          </div>
        )}
      </div>
    </Card>
  );
}
