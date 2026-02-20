import type { Block } from "@blocknote/core";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "project-description-images";

function isBlobUrl(url: string): boolean {
  return typeof url === "string" && url.startsWith("blob:");
}

async function uploadBlobToStorage(
  supabase: SupabaseClient,
  projectId: string,
  blobUrl: string,
  index: number
): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "png";
  const path = `${projectId}/description/${Date.now()}-${index}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBlobUrlsInBlocks(
  supabase: SupabaseClient,
  projectId: string,
  blocks: Block[]
): Promise<Block[]> {
  const result: Block[] = [];
  let imageIndex = 0;

  async function process(block: Block): Promise<Block> {
    const child = { ...block };
    if (child.type === "image" && child.props?.url && isBlobUrl(child.props.url)) {
      const publicUrl = await uploadBlobToStorage(
        supabase,
        projectId,
        child.props.url,
        imageIndex++
      );
      child.props = { ...child.props, url: publicUrl };
    }
    if (child.children?.length) {
      child.children = await Promise.all(child.children.map(process));
    }
    return child;
  }

  return Promise.all(blocks.map(process));
}

export function blocksToDescriptionString(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

export function parseDescriptionToBlocks(description: string | null): undefined | Block[] {
  if (!description?.trim()) return undefined;
  try {
    const parsed = JSON.parse(description) as unknown;
    return Array.isArray(parsed) ? (parsed as Block[]) : undefined;
  } catch {
    return undefined;
  }
}

export function legacyPlainTextToBlocks(plainText: string): Block[] {
  const text = plainText.trim();
  if (!text) return [{ id: "legacy", type: "paragraph", content: [], children: [] } as Block];
  return [
    {
      id: "legacy",
      type: "paragraph",
      content: [{ type: "text", text, styles: {} }],
      children: [],
    } as Block,
  ];
}

export function blocksToPlainTextPreview(blocks: Block[], maxLength = 300): string {
  const parts: string[] = [];
  function walk(b: Block[]) {
    for (const block of b) {
      if (block.content?.length) {
        for (const c of block.content as { text?: string }[]) {
          if (typeof (c as { text?: string }).text === "string")
            parts.push((c as { text: string }).text);
        }
      }
      if (block.children?.length) walk(block.children);
    }
  }
  walk(blocks);
  const text = parts.join(" ").trim();
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}
