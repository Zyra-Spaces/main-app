/**
 * Supabase Storage Image Loader for Next.js Image Optimization
 * Uses Supabase's image transformation API for resizing and optimization
 * Falls back to original URL for free tier (Pro plan required for /render/image)
 */
export default function supabaseLoader({
  src,
  width,
  quality = 80,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If src is not a Supabase storage URL, return as-is
  if (!src.includes("supabase.co/storage")) {
    return src;
  }

  // Check if URL already uses /render/image (Pro plan) or /object/public (free tier)
  if (src.includes("/render/image")) {
    // Already using Pro plan transformation, return as-is (may need width update)
    const url = new URL(src);
    url.searchParams.set("width", width.toString());
    url.searchParams.set("quality", quality.toString());
    return url.toString();
  }

  // Free tier: return original URL (no transformation)
  // For free tier, use original URL. Upgrade to Pro for image transformations.
  if (src.includes("/object/public")) {
    return src;
  }

  // Extract the path from the Supabase public URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
  const url = new URL(src);
  const pathParts = url.pathname.split("/");
  const bucketIndex = pathParts.indexOf("public") + 1;
  const bucket = pathParts[bucketIndex];
  const path = pathParts.slice(bucketIndex + 1).join("/");

  // Try to use Supabase's render/image endpoint (requires Pro plan)
  // If this fails, Next.js will fall back to the original URL
  const projectRef = url.hostname.split(".")[0];
  return `https://${projectRef}.supabase.co/storage/v1/render/image/public/${bucket}/${path}?width=${width}&quality=${quality}`;
}
