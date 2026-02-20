"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/projects/project-card";
import { getRoleSearchKeywords } from "@/lib/project-roles";

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

const TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open for contributors" },
  { value: "trending", label: "Trending" },
  { value: "open_source", label: "Open source" },
  { value: "startup", label: "Startups" },
  { value: "recommended", label: "Recommended" },
] as const;

export function FeedClient({
  initialProjects,
  userId,
  userQualifications,
}: {
  initialProjects: ProjectWithMeta[];
  userId: string;
  userQualifications: string[];
}) {
  const [tab, setTab] = useState("all");
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Server-side search when query is 2+ characters
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setSearchLoading(true);
        try {
          const res = await fetch(`/api/projects/search?q=${encodeURIComponent(search.trim())}`);
          const data = await res.json();
          if (data.projects) {
            // Fetch upvote data for searched projects
            const projectIds = data.projects.map((p: ProjectWithMeta) => p.id);
            const upvotesRes = await fetch("/api/upvotes").catch(() => null);
            const upvotesData = upvotesRes ? await upvotesRes.json().catch(() => ({ data: [] })) : { data: [] };
            const upvoteCounts = (upvotesData.data ?? []).reduce(
              (acc: Record<string, number>, u: { project_id: string }) => {
                if (projectIds.includes(u.project_id)) {
                  acc[u.project_id] = (acc[u.project_id] ?? 0) + 1;
                }
                return acc;
              },
              {} as Record<string, number>
            );
            const userUpvotesRes = userId
              ? await fetch(`/api/upvotes?user=${userId}`).catch(() => null)
              : null;
            const userUpvotesData = userUpvotesRes ? await userUpvotesRes.json().catch(() => ({ data: [] })) : { data: [] };
            const userUpvotedSet = new Set((userUpvotesData.data ?? []).map((u: { project_id: string }) => u.project_id));
            const projectsWithUpvotes = data.projects.map((p: ProjectWithMeta) => ({
              ...p,
              upvoteCount: upvoteCounts[p.id] ?? 0,
              userUpvoted: userUpvotedSet.has(p.id),
            }));
            setProjects(projectsWithUpvotes);
          }
        } catch (err) {
          console.error("[search]", err);
        } finally {
          setSearchLoading(false);
        }
      } else if (search.trim().length === 0) {
        // Reset to initial projects when search is cleared
        setProjects(initialProjects);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [search, initialProjects, userId]);

  const filtered = useMemo(() => {
    let list = [...projects];
    // Client-side filtering for tabs only (search is handled server-side)
    if (tab === "open") {
      list = list.filter((p) => p.status === "open");
    } else if (tab === "trending") {
      // Sort by upvotes + view count (from analytics) + recency
      list = [...list].sort((a, b) => {
        const aViews = (a as { project_analytics?: { view_count?: number }[] }).project_analytics?.[0]?.view_count ?? 0;
        const bViews = (b as { project_analytics?: { view_count?: number }[] }).project_analytics?.[0]?.view_count ?? 0;
        const aScore = a.upvoteCount * 2 + aViews + (new Date(a.updated_at).getTime() / 1000000);
        const bScore = b.upvoteCount * 2 + bViews + (new Date(b.updated_at).getTime() / 1000000);
        return bScore - aScore;
      });
    } else if (tab === "open_source") {
      list = list.filter((p) => p.category === "open_source");
    } else if (tab === "startup") {
      list = list.filter((p) => p.category === "startup");
    } else if (tab === "recommended") {
      list = list.filter((p) => {
        const roles =
          (p as { contributor_roles?: { role: string }[] }).contributor_roles ?? [];
        const roleKeywords = roles.flatMap((r) =>
          getRoleSearchKeywords(r.role).map((k) => k.toLowerCase())
        );
        const qLower = userQualifications.map((q) => q.toLowerCase());
        return qLower.some(
          (q) =>
            roleKeywords.some((r) => r.includes(q) || q.includes(r))
        );
      });
    }
    if (tab === "trending") return list;
    return [...list].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [projects, tab, userQualifications]);

  const displayList = filtered;

  const onUpvoteChange = (projectId: string, upvoted: boolean, newCount: number) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, userUpvoted: upvoted, upvoteCount: newCount }
          : p
      )
    );
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="flex flex-wrap gap-1 mb-6">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mb-6">
        <Input
          placeholder="Search projects... (server-side fuzzy search)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm font-inconsolata"
          disabled={searchLoading}
        />
        {searchLoading && (
          <p className="font-inconsolata text-xs text-muted-foreground mt-1">
            Searching...
          </p>
        )}
      </div>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-0">
          <div className="space-y-6">
          {displayList.length === 0 ? (
            <p className="font-inconsolata text-muted-foreground">
              {search.trim().length >= 2
                ? "No projects found. Try a different search term."
                : "No projects match this filter."}{" "}
              <Link href="/projects/new" className="text-foreground hover:underline">
                Start a project
              </Link>
            </p>
          ) : (
            displayList.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                userId={userId}
                onUpvoteChange={onUpvoteChange}
              />
            ))
          )}
        </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
