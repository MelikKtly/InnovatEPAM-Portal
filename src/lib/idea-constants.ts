// Shared idea constants & types — safe to import from client components.
// MUST NOT import anything Node-only (e.g. better-sqlite3).

export type IdeaCategory =
  | "Technical Innovation"
  | "Process Improvement"
  | "Client Solutions"
  | "Cost Reduction";

export const IDEA_CATEGORIES: readonly IdeaCategory[] = [
  "Technical Innovation",
  "Process Improvement",
  "Client Solutions",
  "Cost Reduction",
] as const;

export type IdeaStatus =
  | "submitted"
  | "under review"
  | "accepted"
  | "rejected";
