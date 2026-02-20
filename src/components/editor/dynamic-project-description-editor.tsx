"use client";

import dynamic from "next/dynamic";
import type { ProjectDescriptionEditorProps } from "./project-description-editor";

export const DynamicProjectDescriptionEditor = dynamic(
  () =>
    import("./project-description-editor").then((m) => ({
      default: m.ProjectDescriptionEditor,
    })),
  { ssr: false }
) as React.ComponentType<ProjectDescriptionEditorProps>;
