"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FileText, Save, Send, Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDEA_CATEGORIES, type IdeaCategory } from "@/lib/idea-constants";
import { extraFieldFor, parseExtraDetails } from "@/lib/extra-fields";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

type Mode = "create" | "edit-draft";

type DraftPayload = {
  id: number;
  title: string;
  description: string;
  category: string;
  file_name: string | null;
  file_path: string | null;
  is_draft: 0 | 1;
  extra_details: string | null;
};

export default function SubmitIdeaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draft");
  const draftId = draftIdParam ? Number(draftIdParam) : null;

  const [mode, setMode] = useState<Mode>(draftId ? "edit-draft" : "create");
  const [loading, setLoading] = useState<boolean>(Boolean(draftId));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IdeaCategory>(IDEA_CATEGORIES[0]);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<{
    name: string;
    path: string;
  } | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "draft" | "submit">(null);

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ideas/${draftId}`);
        const data = (await res.json()) as {
          idea?: DraftPayload;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.idea) {
          setError(data.error ?? "Draft not found");
          setMode("create");
          return;
        }
        if (data.idea.is_draft !== 1) {
          setError("This idea is no longer a draft and cannot be edited.");
          setMode("create");
          return;
        }
        setTitle(data.idea.title);
        setDescription(data.idea.description);
        setCategory(data.idea.category as IdeaCategory);
        setExtras(parseExtraDetails(data.idea.extra_details));
        if (data.idea.file_path && data.idea.file_name) {
          setExistingFile({
            name: data.idea.file_name,
            path: data.idea.file_path,
          });
        }
      } catch {
        if (!cancelled) setError("Failed to load draft");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  async function send(asDraft: boolean) {
    setError(null);
    if (file && file.size > MAX_FILE_BYTES) {
      setError("File exceeds 10 MB limit");
      return;
    }

    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    form.set("category", category);
    form.set("is_draft", asDraft ? "1" : "0");
    const extraDef = extraFieldFor(category);
    if (extraDef) {
      form.set(extraDef.key, (extras[extraDef.key] ?? "").trim());
    }
    if (file) form.set("file", file);
    if (mode === "edit-draft" && removeExisting && !file) {
      form.set("remove_file", "1");
    }

    setBusy(asDraft ? "draft" : "submit");
    try {
      const url =
        mode === "edit-draft" && draftId
          ? `/api/ideas/${draftId}`
          : "/api/ideas";
      const method = mode === "edit-draft" ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: form });
      const data = (await res.json()) as {
        ok?: boolean;
        idea?: { id: number };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.idea) {
        setError(data.error ?? "Save failed");
        return;
      }
      router.replace(asDraft ? "/ideas" : `/ideas/${data.idea.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(false);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-8">
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Loading draft…
        </Card>
      </div>
    );
  }

  const isEdit = mode === "edit-draft";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-8">
      <div className="mb-8 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          {isEdit ? (
            <>
              <FileText className="h-3.5 w-3.5" />
              Editing draft
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              New submission
            </>
          )}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {isEdit ? (
            <>
              Refine your <span className="text-gradient">draft</span>
            </>
          ) : (
            <>
              Share your <span className="text-gradient">next big idea</span>
            </>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update your draft, or submit it for review when you're ready."
            : "Describe your idea, pick a category and (optionally) attach a supporting document."}
        </p>
      </div>

      <Card className="p-8">
        <CardContent className="p-0">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                minLength={3}
                maxLength={200}
                placeholder="A short, evocative name for your idea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                rows={6}
                minLength={10}
                placeholder="What problem are you solving? What's the outcome?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {IDEA_CATEGORIES.map((c) => {
                  const active = c === category;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                        active
                          ? "border-primary bg-primary/10 font-medium text-primary shadow-sm shadow-indigo-500/10"
                          : "border-input bg-background/40 hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const def = extraFieldFor(category);
              if (!def) return null;
              const value = extras[def.key] ?? "";
              const setValue = (v: string) =>
                setExtras((prev) => ({ ...prev, [def.key]: v }));
              return (
                <div className="space-y-2 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`extra-${def.key}`} className="text-sm">
                      {def.label}
                    </Label>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {category}
                    </span>
                  </div>
                  {def.hint ? (
                    <p className="text-xs text-muted-foreground">{def.hint}</p>
                  ) : null}
                  {def.kind === "textarea" ? (
                    <Textarea
                      id={`extra-${def.key}`}
                      rows={4}
                      placeholder={def.placeholder}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  ) : (
                    <Input
                      id={`extra-${def.key}`}
                      placeholder={def.placeholder}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  )}
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>
                Attachment{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, max 10 MB)
                </span>
              </Label>

              {file ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                      <UploadCloud className="h-4 w-4" />
                    </span>
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {humanSize(file.size)}
                        {existingFile ? " · replaces existing" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : existingFile && !removeExisting ? (
                <div className="flex items-center justify-between rounded-xl border border-input bg-background/40 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{existingFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Already attached · upload a new file to replace
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemoveExisting(true)}
                    aria-label="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="file"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background/40 p-8 text-center transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UploadCloud className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">
                    Drop a file here, or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOCX, images — up to 10 MB
                  </span>
                </label>
              )}
              <Input
                id="file"
                type="file"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={busy !== null}
                onClick={() => void send(true)}
                className="sm:w-1/2"
              >
                <Save className="h-4 w-4" />
                {busy === "draft"
                  ? "Saving…"
                  : isEdit
                    ? "Update draft"
                    : "Save as draft"}
              </Button>
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={busy !== null}
                className="sm:w-1/2"
              >
                <Send className="h-4 w-4" />
                {busy === "submit"
                  ? "Submitting…"
                  : isEdit
                    ? "Final submit"
                    : "Submit idea"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
