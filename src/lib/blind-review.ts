import type { IdeaStatus } from "@/lib/idea-constants";

/**
 * Identity is revealed only once a final decision has been made.
 * While submitted / under review, admins see "Anonymous".
 */
export function isIdentityRevealed(status: IdeaStatus): boolean {
  return status === "accepted" || status === "rejected";
}

export const ANONYMOUS_LABEL = "Anonymous";

/**
 * Strip the submitter's email from a row before it leaves the server
 * when identity should be hidden. The original email never reaches
 * the React render tree or the client payload.
 */
export function redactIdentity<T extends { submitter_email: string; status: IdeaStatus }>(
  row: T,
): T {
  if (isIdentityRevealed(row.status)) return row;
  return { ...row, submitter_email: "" };
}
