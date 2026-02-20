"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  message: string | null;
  project_id: string | null;
  read_status: boolean;
  created_at: string;
};

type TrendingProject = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cover_url: string | null;
  upvoteCount: number;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

const NOTIFICATIONS_LIMIT = 30;

export function RightPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [filterText, setFilterText] = useState("");
  const [trending, setTrending] = useState<TrendingProject[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, message, project_id, read_status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(NOTIFICATIONS_LIMIT);

      if (data) {
        setNotifications(data);
        const ids = [...new Set((data as Notification[]).map((n) => n.project_id).filter(Boolean))] as string[];
        if (ids.length > 0) {
          const { data: projects } = await supabase
            .from("projects")
            .select("id, name")
            .in("id", ids);
          const map: Record<string, string> = {};
          (projects ?? []).forEach((p: { id: string; name: string }) => {
            map[p.id] = p.name;
          });
          setProjectNames(map);
        }
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel("right-panel-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/projects/trending", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => data.projects && setTrending(data.projects))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("user_id", user.id)
      .eq("read_status", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
  };

  const types = useMemo(() => {
    const set = new Set(notifications.map((n) => n.type).filter(Boolean));
    return Array.from(set).sort();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterProjectId !== "all" && n.project_id !== filterProjectId) return false;
      if (filterText.trim()) {
        const q = filterText.toLowerCase();
        const matchMessage = n.message?.toLowerCase().includes(q);
        const matchType = n.type?.toLowerCase().includes(q);
        const matchProject = n.project_id && projectNames[n.project_id]?.toLowerCase().includes(q);
        if (!matchMessage && !matchType && !matchProject) return false;
      }
      return true;
    });
  }, [notifications, filterType, filterProjectId, filterText, projectNames]);

  const projectOptions = useMemo(() => {
    const ids = [...new Set(notifications.map((n) => n.project_id).filter(Boolean))] as string[];
    return ids.map((id) => ({ id, name: projectNames[id] ?? id }));
  }, [notifications, projectNames]);

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  if (!user) return null;

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 h-screen border-l border-border bg-card overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {/* Notifications & updates */}
        <div className="border-b border-border flex-shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="font-nunito font-semibold text-sm">Notifications & updates</h2>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="font-inconsolata text-xs h-7"
              >
                Mark all read
              </Button>
            )}
          </div>
          <div className="p-2 space-y-2">
            <Input
              placeholder="Filter by keyword..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-8 text-xs font-inconsolata rounded"
            />
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 text-xs font-inconsolata rounded border border-border bg-background px-2 min-w-0 flex-1"
              >
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="h-8 text-xs font-inconsolata rounded border border-border bg-background px-2 min-w-0 flex-1"
              >
                <option value="all">All projects</option>
                {projectOptions.map(({ id, name }) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-2 space-y-2 max-h-48 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <p className="font-inconsolata text-xs text-muted-foreground p-2">
                No notifications
              </p>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 rounded border border-border cursor-pointer transition-colors",
                    !n.read_status ? "bg-muted" : "bg-card hover:bg-muted/50"
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <p className="font-inconsolata text-xs">{n.message ?? n.type}</p>
                  <p className="font-inconsolata text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                    {n.project_id && projectNames[n.project_id] && (
                      <> · {projectNames[n.project_id]}</>
                    )}
                  </p>
                  {n.project_id && (
                    <Link
                      href={`/projects/${n.project_id}`}
                      className="font-inconsolata text-[10px] text-foreground hover:underline mt-1 block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View project →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trending */}
        <div className="flex flex-col flex-1 p-3 min-h-0">
          <h2 className="font-nunito font-semibold text-sm mb-3 flex-shrink-0">Trending</h2>
          <div className="space-y-2">
            {trending.length === 0 ? (
              <p className="font-inconsolata text-xs text-muted-foreground">Loading...</p>
            ) : (
              trending.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block rounded border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex gap-3">
                    {p.cover_url ? (
                      <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={p.cover_url}
                          alt=""
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded bg-muted flex items-center justify-center font-geist-pixel text-lg">
                        {p.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-inconsolata text-sm font-medium truncate">{p.name}</p>
                      <p className="font-inconsolata text-xs text-muted-foreground line-clamp-2">
                        {p.description ?? p.category}
                      </p>
                      <p className="font-inconsolata text-[10px] text-muted-foreground mt-1">
                        {p.upvoteCount} upvotes
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0 self-center">↑</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
