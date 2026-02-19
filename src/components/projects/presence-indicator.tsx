"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export function PresenceIndicator({
  projectId,
  userId,
  isFounder,
}: {
  projectId: string;
  userId: string | undefined;
  isFounder: boolean;
}) {
  const [viewers, setViewers] = useState(0);
  const [founderOnline, setFounderOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel(`project-${projectId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceEntries = Object.values(state).flat() as Array<{
          user_id?: string;
          is_founder?: boolean;
        }>;
        const viewerCount = presenceEntries.length;
        const founderPresent = presenceEntries.some((p) => p.is_founder === true);

        setViewers(viewerCount);
        setFounderOnline(founderPresent);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            is_founder: isFounder,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
  }, [projectId, userId, isFounder]);

  if (viewers === 0) return null;

  return (
    <div className="flex gap-2 items-center">
      {founderOnline && (
        <Badge variant="secondary" className="font-inconsolata text-xs">
          Founder is online
        </Badge>
      )}
      <Badge variant="outline" className="font-inconsolata text-xs">
        {viewers} {viewers === 1 ? "person" : "people"} viewing
      </Badge>
    </div>
  );
}
