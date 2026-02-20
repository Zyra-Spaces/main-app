import { ServerBlockNoteEditor } from "@blocknote/server-util";

export async function descriptionBlocksToHtml(
  description: string | null
): Promise<string | null> {
  if (!description?.trim()) return null;
  let blocks: unknown;
  try {
    blocks = JSON.parse(description);
  } catch {
    return null;
  }
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  try {
    const editor = ServerBlockNoteEditor.create();
    const html = await editor.blocksToFullHTML(blocks as never);
    return html;
  } catch {
    return null;
  }
}
