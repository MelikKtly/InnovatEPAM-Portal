import type { IdeaCategory } from "@/lib/idea-constants";

/**
 * Definition of the optional category-specific field that the submission form
 * collects in addition to the base description. Stored as JSON in
 * `ideas.extra_details`.
 */
export type ExtraFieldKind = "textarea" | "input";

export type ExtraFieldDef = {
  /** Storage key inside the extra_details JSON object. */
  key: string;
  /** Label rendered in the form and detail views. */
  label: string;
  /** Short helper text shown below the label in the form. */
  hint?: string;
  /** Placeholder text shown inside the empty control. */
  placeholder?: string;
  /** Whether to render as a textarea or single-line input. */
  kind: ExtraFieldKind;
};

const EXTRA_FIELDS: Partial<Record<IdeaCategory, ExtraFieldDef>> = {
  "Technical Innovation": {
    key: "tech_stack",
    label: "Technical Stack / Tools proposed",
    hint: "Languages, frameworks, services or tooling you would use.",
    placeholder: "e.g. Next.js, Postgres, OpenAI API, Kubernetes…",
    kind: "textarea",
  },
  "Process Improvement": {
    key: "current_bottleneck",
    label: "Current Bottleneck",
    hint: "What process or step is slowing things down today?",
    placeholder: "Describe where teams currently lose time or accuracy…",
    kind: "textarea",
  },
  "Client Solutions": {
    key: "target_client_group",
    label: "Target Client Group",
    hint: "Which segment, industry or persona benefits from this?",
    placeholder: "e.g. Mid-market financial services CTOs",
    kind: "input",
  },
};

export function extraFieldFor(
  category: IdeaCategory,
): ExtraFieldDef | undefined {
  return EXTRA_FIELDS[category];
}

/**
 * Parse the JSON blob stored in `ideas.extra_details`. Returns an empty object
 * if the value is missing or malformed.
 */
export function parseExtraDetails(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim().length > 0) out[k] = v;
      }
      return out;
    }
  } catch {
    // ignore malformed
  }
  return {};
}

/**
 * Build the JSON string to persist for the given category. Returns `null` when
 * no value should be stored (so the column stays NULL).
 */
export function buildExtraDetails(
  category: IdeaCategory,
  values: Record<string, string | undefined>,
): string | null {
  const def = extraFieldFor(category);
  if (!def) return null;
  const value = (values[def.key] ?? "").trim();
  if (!value) return null;
  return JSON.stringify({ [def.key]: value });
}

/**
 * Look up the labelled value for the category-specific extra detail of an
 * idea. Returns `null` if no value is stored.
 */
export function readExtraDetail(
  category: IdeaCategory,
  raw: string | null,
): { label: string; value: string; kind: ExtraFieldKind } | null {
  const def = extraFieldFor(category);
  if (!def) return null;
  const parsed = parseExtraDetails(raw);
  const value = parsed[def.key];
  if (!value) return null;
  return { label: def.label, value, kind: def.kind };
}
