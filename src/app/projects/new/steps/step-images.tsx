"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StepImagesProps = {
  coverFile: File | null;
  setCoverFile: (f: File | null) => void;
  bannerFile: File | null;
  setBannerFile: (f: File | null) => void;
  coverPreview: string | null;
  bannerPreview: string | null;
};

export function StepImages({
  coverFile,
  setCoverFile,
  bannerFile,
  setBannerFile,
  coverPreview,
  bannerPreview,
}: StepImagesProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <label className="font-inconsolata text-sm mb-2 block">Cover image</label>
        <div className="flex flex-col gap-3">
          {coverPreview ? (
            <div className="relative w-full max-w-xs aspect-square border border-input overflow-hidden bg-muted">
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCoverFile(null);
                    if (coverInputRef.current) coverInputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                >
                  Replace
                </Button>
              </div>
            </div>
          ) : null}
          <Input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="max-w-xs"
          />
        </div>
        <p className="font-inconsolata text-xs text-muted-foreground mt-1">
          Square or boxed aspect. Shown on cards and profile.
        </p>
      </div>
      <div>
        <label className="font-inconsolata text-sm mb-2 block">Banner image</label>
        <div className="flex flex-col gap-3">
          {bannerPreview ? (
            <div className="relative w-full aspect-[3/1] max-h-40 border border-input overflow-hidden bg-muted">
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setBannerFile(null);
                    if (bannerInputRef.current) bannerInputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  Replace
                </Button>
              </div>
            </div>
          ) : null}
          <Input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
            className="max-w-md"
          />
        </div>
        <p className="font-inconsolata text-xs text-muted-foreground mt-1">
          Wide aspect ratio. Shown at top of project page.
        </p>
      </div>
    </div>
  );
}
