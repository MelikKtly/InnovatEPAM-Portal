"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDEA_CATEGORIES } from "@/lib/db";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

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
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Submit an idea</CardTitle>
          <CardDescription>
            Share an innovation idea. Attach a supporting document if useful.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                minLength={3}
                maxLength={200}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Attachment (optional, max 10 MB)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Submit idea"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
