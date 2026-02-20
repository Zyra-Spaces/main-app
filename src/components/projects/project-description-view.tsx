"use client";

import { useEffect, useRef, useState } from "react";

export function ProjectDescriptionView({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      const wrapper = document.createElement("div");
      wrapper.className = "relative group inline-block max-w-full";
      img.parentNode?.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      const overlay = document.createElement("button");
      overlay.type = "button";
      overlay.className =
        "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in rounded";
      overlay.setAttribute("aria-label", "Expand image");
      overlay.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
      overlay.addEventListener("click", (e) => {
        e.preventDefault();
        setExpandedImage(img.getAttribute("src") || null);
      });
      wrapper.appendChild(overlay);
    });
  }, [html]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {expandedImage && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
          aria-label="Close"
        >
          <img
            src={expandedImage}
            alt="Expanded"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      )}
    </>
  );
}
