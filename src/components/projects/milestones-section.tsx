"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ButtonCornerWrapper } from "@/components/ui/button";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  target_date: string | null;
  created_at: string;
};

export function MilestonesSection({
  projectId,
  isFounder,
  initialMilestones,
}: {
  projectId: string;
  isFounder: boolean;
  initialMilestones: Milestone[];
}) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data } = await supabase
      .from("project_milestones")
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        target_date: targetDate || null,
        status: "pending",
      })
      .select()
      .single();

    if (data) {
      setMilestones((prev) => [data, ...prev]);
      setTitle("");
      setDescription("");
      setTargetDate("");
      setShowForm(false);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: Milestone["status"]) => {
    await supabase
      .from("project_milestones")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  const statusColors = {
    pending: "secondary",
    in_progress: "default",
    completed: "outline",
    cancelled: "muted",
  } as const;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-nunito text-lg font-semibold">Milestones</h2>
          {isFounder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "Add milestone"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && isFounder && (
          <form onSubmit={handleAddMilestone} className="mb-6 space-y-4">
            <Input
              placeholder="Milestone title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <Input
              type="date"
              placeholder="Target date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <ButtonCornerWrapper variant="default">
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? "Adding..." : "Add milestone"}
              </Button>
            </ButtonCornerWrapper>
          </form>
        )}

        {milestones.length === 0 ? (
          <p className="font-inconsolata text-sm text-muted-foreground">
            No milestones yet.
          </p>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-4 p-4 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-nunito font-semibold">{m.title}</h3>
                    <Badge variant={statusColors[m.status]}>
                      {m.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {m.description && (
                    <p className="font-inconsolata text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  )}
                  {m.target_date && (
                    <p className="font-inconsolata text-xs text-muted-foreground mt-1">
                      Target: {new Date(m.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {isFounder && (
                  <div className="flex gap-2">
                    {m.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(m.id, "completed")}
                      >
                        Complete
                      </Button>
                    )}
                    {m.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(m.id, "in_progress")}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
