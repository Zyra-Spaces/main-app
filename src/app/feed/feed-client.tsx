"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/projects/project-card";

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

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (tab === "open") {
      list = list.filter((p) => p.status === "open");
    } else if (tab === "trending") {
      list = [...list].sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else if (tab === "open_source") {
      list = list.filter((p) => p.category === "open_source");
    } else if (tab === "startup") {
      list = list.filter((p) => p.category === "startup");
    } else if (tab === "recommended") {
      list = list.filter((p) => {
        const roles =
          (p as { contributor_roles?: { role: string }[] }).contributor_roles ?? [];
        const roleSkills = roles.map((r) => r.role.toLowerCase());
        return userQualifications.some(
          (q) =>
            roleSkills.some((r) => r.includes(q.toLowerCase())) ||
            roleSkills.some((r) => q.toLowerCase().includes(r))
        );
      });
    }
    if (tab === "trending") return list;
    return [...list].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [projects, tab, userQualifications, search]);

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
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm font-inconsolata"
        />
      </div>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-0">
          <div className="space-y-6">
          {displayList.length === 0 ? (
            <p className="font-inconsolata text-muted-foreground">
              No projects match this filter.{" "}
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
