"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDEA_CATEGORIES } from "@/lib/idea-constants";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function SubmitIdeaPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(IDEA_CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (file && file.size > MAX_FILE_BYTES) {
      setError("File exceeds 10 MB limit");
      return;
    }

    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    form.set("category", category);
    if (file) form.set("file", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", { method: "POST", body: form });
      const data = (await res.json()) as {
        ok?: boolean;
        idea?: { id: number };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.idea) {
        setError(data.error ?? "Submission failed");
        return;
      }
      router.replace(`/ideas/${data.idea.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-8">
      <div className="mb-8 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          New submission
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Share your <span className="text-gradient">next big idea</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your idea, pick a category and (optionally) attach a
          supporting document.
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

            <div className="space-y-2">
              <Label>Attachment <span className="font-normal text-muted-foreground">(optional, max 10 MB)</span></Label>
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

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Submitting…" : "Submit idea"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
