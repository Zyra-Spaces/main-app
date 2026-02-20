"use client";

import { Input } from "@/components/ui/input";

type LinkItem = { type: "github" | "linkedin" | "peerlist"; url: string };

type StepLinksProps = {
  links: LinkItem[];
  updateLink: (type: "github" | "linkedin" | "peerlist", url: string) => void;
};

export function StepLinks({ links, updateLink }: StepLinksProps) {
  return (
    <div className="space-y-4">
      <p className="font-inconsolata text-sm text-muted-foreground">
        GitHub, LinkedIn, Peerlist
      </p>
      {links.map((l) => (
        <div key={l.type}>
          <label className="font-inconsolata text-sm mb-2 block capitalize">
            {l.type} URL
          </label>
          <Input
            type="url"
            placeholder={`https://${l.type}.com/...`}
            value={l.url}
            onChange={(e) => updateLink(l.type, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
