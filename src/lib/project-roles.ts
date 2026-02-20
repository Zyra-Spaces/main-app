/**
 * Predefined contributor roles for projects.
 * Keeps data consistent and enables better tracking and recommendations.
 */
export const PREDEFINED_PROJECT_ROLES = [
  { value: "ui_ux_designer", label: "UI/UX Designer" },
  { value: "frontend_developer", label: "Frontend Developer" },
  { value: "backend_developer", label: "Backend Developer" },
  { value: "full_stack_developer", label: "Full Stack Developer" },
  { value: "mobile_developer", label: "Mobile Developer (iOS/Android)" },
  { value: "devops_engineer", label: "DevOps Engineer" },
  { value: "product_manager", label: "Product Manager" },
  { value: "data_scientist", label: "Data Scientist / ML Engineer" },
  { value: "qa_engineer", label: "QA Engineer" },
  { value: "marketing", label: "Marketing" },
  { value: "content_writer", label: "Content Writer" },
  { value: "community_manager", label: "Community Manager" },
  { value: "other", label: "Other" },
] as const;

export type ProjectRoleValue = (typeof PREDEFINED_PROJECT_ROLES)[number]["value"];
export type ProjectRoleLabel = (typeof PREDEFINED_PROJECT_ROLES)[number]["label"];

export function getRoleLabel(value: string): string {
  const found = PREDEFINED_PROJECT_ROLES.find((r) => r.value === value);
  return found ? found.label : value;
}

/** Keywords for matching user qualifications to roles (e.g. for Recommended feed). */
export function getRoleSearchKeywords(value: string): string[] {
  const label = getRoleLabel(value);
  const fromValue = value.split("_").filter(Boolean);
  const fromLabel = label.toLowerCase().split(/\s*[\/\s]\s*/).flatMap((s) => s.split(/\s+/));
  return [...new Set([...fromValue, ...fromLabel])].filter(Boolean);
}
