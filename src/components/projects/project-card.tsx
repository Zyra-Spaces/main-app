"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { rateLimiters } from "@/lib/rate-limit";

type ProjectWithMeta = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  cover_url: string | null;
  execution_type: string;
  created_at: string;
  updated_at: string;
  founder_id: string;
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
  upvoteCount: number;
  userUpvoted: boolean;
};

export function ProjectCard({
  project,
  userId,
  onUpvoteChange,
}: {
  project: ProjectWithMeta;
  userId: string;
  onUpvoteChange: (projectId: string, upvoted: boolean, newCount: number) => void;
}) {
  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;

    // Rate limiting: 30/min per user
    const identifier = `upvote:${userId}`;
    const limitResult = rateLimiters.upvote(identifier);
    if (!limitResult.success) {
      return; // Silently fail for rate limit
    }

    const supabase = createClient();
    if (project.userUpvoted) {
      await supabase
        .from("upvotes")
        .delete()
        .eq("project_id", project.id)
        .eq("user_id", userId);
      onUpvoteChange(project.id, false, project.upvoteCount - 1);
    } else {
      await supabase.from("upvotes").insert({
        project_id: project.id,
        user_id: userId,
      });
      onUpvoteChange(project.id, true, project.upvoteCount + 1);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(
      typeof window !== "undefined"
        ? `${window.location.origin}/projects/${project.id}`
        : ""
    );
  };

  const founder = project.profiles;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="overflow-hidden hover:border-muted-foreground/30 transition-colors">
        <div className="relative aspect-[2/1] bg-muted">
          {project.cover_url ? (
            <Image
              src={project.cover_url}
              alt=""
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, 896px"
              quality={80}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-inconsolata text-muted-foreground text-sm">
              No cover
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-nunito text-lg font-semibold truncate">
                {project.name}
              </h3>
              <p className="font-inconsolata text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">{project.category}</Badge>
                <Badge variant="secondary">{project.execution_type}</Badge>
              </div>
              {founder && (
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={founder.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(founder.full_name ?? "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-inconsolata text-xs text-muted-foreground">
                    {founder.full_name ?? "Founder"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUpvote}
                className={cn(
                  "font-inconsolata",
                  project.userUpvoted && "text-foreground"
                )}
              >
                {project.userUpvoted ? "▲" : "△"} {project.upvoteCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="font-inconsolata"
              >
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
