"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block, PartialBlock } from "@blocknote/core";
import { useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_PROJECT_IMAGES = 5;

function countImageBlocks(blocks: Block[]): number {
  let n = 0;
  function walk(b: Block[]) {
    for (const block of b) {
      if (block.type === "image") n++;
      if (block.children?.length) walk(block.children);
    }
  }
  walk(blocks);
  return n;
}

export type ProjectDescriptionEditorProps = {
  initialContent?: PartialBlock[] | null;
  onChange?: (blocks: Block[]) => void;
  projectId?: string | null;
  coverCount?: number;
  bannerCount?: number;
  onImageLimitReached?: () => void;
  className?: string;
};

export function ProjectDescriptionEditor({
  initialContent,
  onChange,
  projectId,
  coverCount = 0,
  bannerCount = 0,
  onImageLimitReached,
  className,
}: ProjectDescriptionEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent ?? undefined,
    pasteHandler: async ({ event, editor: ed, defaultPasteHandler }) => {
      const files = event.clipboardData?.files;
      if (files?.length) {
        const file = Array.from(files).find((f) => f.type.startsWith("image/"));
        if (file) {
          const doc = ed.document;
          const imageCount =
            countImageBlocks(doc) + coverCount + bannerCount;
          if (imageCount >= MAX_PROJECT_IMAGES) {
            onImageLimitReached?.();
            return true;
          }
          if (projectId) {
            const supabase = createClient();
            const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
            const path = `${projectId}/description/${Date.now()}.${ext}`;
            const { error } = await supabase.storage
              .from("project-description-images")
              .upload(path, file, { upsert: true });
            if (error) return defaultPasteHandler();
            const { data } = supabase.storage
              .from("project-description-images")
              .getPublicUrl(path);
            const block = ed.getTextCursorPosition().block;
            ed.insertBlocks(
              [{ type: "image", props: { url: data.publicUrl } }],
              block,
              "after"
            );
            return true;
          }
          const url = URL.createObjectURL(file);
          const block = ed.getTextCursorPosition().block;
          ed.insertBlocks(
            [{ type: "image", props: { url } } as PartialBlock],
            block,
            "after"
          );
          return true;
        }
      }
      return defaultPasteHandler();
    },
  });

  const handleChange = useCallback(() => {
    if (onChange && editor) onChange(editor.document);
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    const cleanup = editor.onChange(handleChange);
    return cleanup;
  }, [editor, handleChange]);

  if (!editor) return null;

  return (
    <div className={className}>
      <BlockNoteView editor={editor} />
    </div>
  );
}
