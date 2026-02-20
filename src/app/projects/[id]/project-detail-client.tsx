"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ButtonCornerWrapper } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { rateLimiters } from "@/lib/rate-limit";
import { PresenceIndicator } from "@/components/projects/presence-indicator";
import { getRoleLabel } from "@/lib/project-roles";

type ContributorRole = { role: string; count: number };
type ContributorRequest = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profiles: { id: string; full_name: string | null } | null;
};
type FeedbackItem = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
};
type ProjectPost = { id: string; content: string; created_at: string };

export function ProjectDetailClient({
  projectId,
  userId,
  isFounder,
  isContributor,
  upvoteCount,
  userUpvoted,
  contributorRoles,
  contributorRequests,
  feedbackList,
  projectPosts,
  projectName,
}: {
  projectId: string;
  userId: string | undefined;
  isFounder: boolean;
  isContributor: boolean;
  upvoteCount: number;
  userUpvoted: boolean;
  contributorRoles: ContributorRole[];
  contributorRequests: ContributorRequest[];
  feedbackList: FeedbackItem[];
  projectPosts: ProjectPost[];
  projectName: string;
}) {
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackListState, setFeedbackListState] = useState(feedbackList);
  const [upvoted, setUpvoted] = useState(userUpvoted);
  const [upvotes, setUpvotes] = useState(upvoteCount);
  const [requestRole, setRequestRole] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState(projectPosts);
  const [requests, setRequests] = useState(contributorRequests);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleUpvote = async () => {
    if (!userId) return;
    if (upvoted) {
      await supabase.from("upvotes").delete().eq("project_id", projectId).eq("user_id", userId);
      setUpvoted(false);
      setUpvotes((c) => c - 1);
    } else {
      await supabase.from("upvotes").insert({ project_id: projectId, user_id: userId });
      setUpvoted(true);
      setUpvotes((c) => c + 1);
    }
  };

  const handleShareLink = async () => {
    await navigator.clipboard.writeText(
      typeof window !== "undefined" ? `${window.location.origin}/projects/${projectId}` : ""
    );
  };

  const handleShareX = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/projects/${projectId}` : "";
    const text = `Check out ${projectName} on Zyra`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !feedbackContent.trim()) return;

    // Rate limiting: 10/min per user
    const identifier = `feedback:${userId}`;
    const limitResult = rateLimiters.feedback(identifier);
    if (!limitResult.success) {
      setError("Too many requests. Please wait before adding more feedback.");
      return;
    }

    // Input validation: max 2000 characters, strip HTML
    const sanitized = feedbackContent.trim().slice(0, 2000).replace(/<[^>]*>/g, "");
    if (!sanitized) {
      setError("Feedback cannot be empty.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("feedback")
      .insert({ project_id: projectId, user_id: userId, content: sanitized })
      .select("id, user_id, content, created_at, profiles(id, full_name, avatar_url)")
      .single();
    
    if (insertError) {
      setError("Failed to submit feedback.");
      return;
    }

    if (data) {
      setFeedbackListState((prev) => [data as unknown as FeedbackItem, ...prev]);
      setFeedbackContent("");
      setError(null);
    }
  };

  const handleRequestToContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !requestRole.trim()) return;
    setRequesting(true);
    await supabase.from("contributor_requests").insert({
      project_id: projectId,
      user_id: userId,
      role: requestRole.trim(),
    });
    setRequestRole("");
    setRequesting(false);
  };

  const handleApproveRequest = async (requestId: string, uid: string, role: string) => {
    if (!isFounder) return;
    await supabase.from("contributor_requests").update({ status: "approved" }).eq("id", requestId);
    await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: uid,
      role,
      status: "approved",
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!isFounder) return;
    await supabase.from("contributor_requests").update({ status: "rejected" }).eq("id", requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFounder || !postContent.trim()) return;
    setPosting(true);
    const { data } = await supabase
      .from("project_posts")
      .insert({ project_id: projectId, content: postContent.trim() })
      .select()
      .single();
    if (data) {
      setPosts((prev) => [data, ...prev]);
      setPostContent("");
      await supabase
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", projectId);
    }
    setPosting(false);
  };

  return (
    <div className="mt-12 space-y-12">
      {userId && (
        <PresenceIndicator projectId={projectId} userId={userId} isFounder={isFounder} />
      )}
      <div className="flex gap-4 flex-wrap">
        <ButtonCornerWrapper variant="outline">
          <Button variant="outline" onClick={handleUpvote}>
            {upvoted ? "▲" : "△"} {upvotes} Upvote
          </Button>
        </ButtonCornerWrapper>
        <ButtonCornerWrapper variant="outline">
          <Button variant="outline" onClick={handleShareLink}>
            Copy link
          </Button>
        </ButtonCornerWrapper>
        {(isContributor || isFounder) && (
          <ButtonCornerWrapper variant="outline">
            <Button variant="outline" onClick={handleShareX}>
              Post on X
            </Button>
          </ButtonCornerWrapper>
        )}
        {isContributor && !isFounder && (
          <ButtonCornerWrapper variant="outline">
            <Button variant="outline" onClick={() => window.open("https://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(typeof window !== "undefined" ? window.location.href : ""), "_blank")}>
              Share on LinkedIn
            </Button>
          </ButtonCornerWrapper>
        )}
      </div>

      {isFounder && requests.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-nunito text-lg font-semibold">Contributor requests</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests
              .filter((r) => r.status === "pending")
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg"
                >
                  <div>
                    <span className="font-inconsolata">{r.profiles?.full_name ?? "User"}</span>
                    <span className="font-inconsolata text-muted-foreground ml-2">({getRoleLabel(r.role)})</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => handleApproveRequest(r.id, r.user_id, r.role)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectRequest(r.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {userId && !isContributor && contributorRoles.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-nunito text-lg font-semibold">Request to contribute</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestToContribute} className="flex gap-3">
              <select
                className="flex h-12 flex-1 border-2 border-input bg-background px-4 font-inconsolata"
                value={requestRole}
                onChange={(e) => setRequestRole(e.target.value)}
              >
                <option value="">Select role</option>
                {contributorRoles.map((r) => (
                  <option key={r.role} value={r.role}>
                    {getRoleLabel(r.role)}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={requesting || !requestRole}>
                Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isFounder && (
        <Card>
          <CardHeader>
            <h2 className="font-nunito text-lg font-semibold">Add update for contributors</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPost} className="space-y-3">
              <Textarea
                placeholder="Share an update..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={3}
              />
              <Button type="submit" disabled={posting || !postContent.trim()}>
                {posting ? "Posting..." : "Post"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-nunito text-lg font-semibold">Project updates</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="border-b border-border pb-4 last:border-0">
                <p className="font-inconsolata text-sm whitespace-pre-wrap">{p.content}</p>
                <p className="font-inconsolata text-xs text-muted-foreground mt-2">
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-nunito text-lg font-semibold">Feedback</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {userId && (
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <Textarea
                placeholder="Add feedback... (max 2000 characters)"
                value={feedbackContent}
                onChange={(e) => {
                  setFeedbackContent(e.target.value.slice(0, 2000));
                  setError(null);
                }}
                rows={3}
                maxLength={2000}
              />
              {error && (
                <p className="font-inconsolata text-sm text-destructive">{error}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="font-inconsolata text-xs text-muted-foreground">
                  {feedbackContent.length}/2000
                </p>
                <Button type="submit" disabled={!feedbackContent.trim() || feedbackContent.length > 2000}>
                  Post feedback
                </Button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            {feedbackListState.map((f) => (
              <div key={f.id} className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={f.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {(f.profiles?.full_name ?? "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-inconsolata text-sm font-medium">
                    {f.profiles?.full_name ?? "User"}
                  </p>
                  <p className="font-inconsolata text-sm text-muted-foreground whitespace-pre-wrap">
                    {f.content}
                  </p>
                  <p className="font-inconsolata text-xs text-muted-foreground mt-1">
                    {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
