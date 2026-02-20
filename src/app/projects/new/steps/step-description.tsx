"use client";

import { Textarea } from "@/components/ui/textarea";

type StepDescriptionProps = {
  description: string;
  setDescription: (v: string) => void;
};

export function StepDescription({
  description,
  setDescription,
}: StepDescriptionProps) {
  return (
    <div className="space-y-4">
      <p className="font-inconsolata text-sm text-muted-foreground">
        Describe your project. You can add more rich content (headings, lists, images) in the next phase.
      </p>
      <div>
        <label className="font-inconsolata text-sm mb-2 block">Description</label>
        <Textarea
          placeholder="Describe your project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          className="min-h-[200px]"
        />
      </div>
    </div>
  );
}
