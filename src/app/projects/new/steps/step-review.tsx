"use client";

import { getRoleLabel } from "@/lib/project-roles";

type Role = { role: string; count: number };
type LinkItem = { type: "github" | "linkedin" | "peerlist"; url: string };

type StepReviewProps = {
  name: string;
  categoryLabel: string;
  executionTypeLabel: string;
  startDate: string;
  endDate: string;
  description: string;
  roles: Role[];
  links: LinkItem[];
  hasCover: boolean;
  hasBanner: boolean;
};

export function StepReview({
  name,
  categoryLabel,
  executionTypeLabel,
  startDate,
  endDate,
  description,
  roles,
  links,
  hasCover,
  hasBanner,
}: StepReviewProps) {
  const validRoles = roles.filter((r) => r.role.trim() && r.count > 0);
  const validLinks = links.filter((l) => l.url.trim());

  return (
    <div className="space-y-6 font-inconsolata text-sm">
      <div>
        <span className="text-muted-foreground">Name</span>
        <p className="mt-0.5">{name || "—"}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Category</span>
        <p className="mt-0.5">{categoryLabel}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Execution type</span>
        <p className="mt-0.5">{executionTypeLabel}</p>
      </div>
      {(startDate || endDate) && (
        <div>
          <span className="text-muted-foreground">Dates</span>
          <p className="mt-0.5">
            {startDate && endDate
              ? `${startDate} – ${endDate}`
              : startDate || endDate}
          </p>
        </div>
      )}
      <div>
        <span className="text-muted-foreground">Description</span>
        <p className="mt-0.5 whitespace-pre-wrap line-clamp-4">
          {description?.trim() || "—"}
        </p>
      </div>
      <div>
        <span className="text-muted-foreground">Images</span>
        <p className="mt-0.5">
          Cover: {hasCover ? "Yes" : "No"}, Banner: {hasBanner ? "Yes" : "No"}
        </p>
      </div>
      <div>
        <span className="text-muted-foreground">Contributor roles</span>
        <ul className="mt-0.5 list-disc list-inside">
          {validRoles.length
            ? validRoles.map((r, i) => (
                <li key={i}>
                  {getRoleLabel(r.role)} × {r.count}
                </li>
              ))
            : ["—"]}
        </ul>
      </div>
      <div>
        <span className="text-muted-foreground">Links</span>
        <ul className="mt-0.5 list-disc list-inside">
          {validLinks.length
            ? validLinks.map((l) => (
                <li key={l.type}>
                  {l.type}: {l.url}
                </li>
              ))
            : ["—"]}
        </ul>
      </div>
    </div>
  );
}
