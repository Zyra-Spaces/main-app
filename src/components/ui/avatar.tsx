"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt = "", src, ...props }, ref) => {
  // Handle external URLs (Google, GitHub, etc.) - use direct URL
  const isGoogleUrl = src && typeof src === 'string' && src.includes('googleusercontent.com');
  const isExternalUrl = src && typeof src === 'string' && (
    src.startsWith('http://') || 
    (src.startsWith('https://') && !src.includes('supabase.co'))
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      src={src}
      className={cn("aspect-square h-full w-full object-cover", className)}
      // Don't use crossOrigin for Google images - they don't support CORS
      crossOrigin={isExternalUrl && !isGoogleUrl ? "anonymous" : undefined}
      referrerPolicy={isExternalUrl ? "no-referrer" : undefined}
      loading="lazy"
      onError={(e) => {
        // Hide image on error, fallback will show
        e.currentTarget.style.display = 'none';
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted font-inconsolata text-sm font-medium",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
