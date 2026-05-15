import {
  Download,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AttachmentRow } from "@/lib/db";
import { isImageType } from "@/lib/attachments-query";
import { cn } from "@/lib/utils";

function iconFor(fileType: string): LucideIcon {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.startsWith("video/")) return FileVideo;
  if (fileType.startsWith("audio/")) return FileAudio;
  if (fileType === "application/pdf") return FileText;
  if (
    fileType.includes("spreadsheet") ||
    fileType === "text/csv" ||
    fileType.includes("excel")
  )
    return FileSpreadsheet;
  if (fileType === "application/zip" || fileType.includes("compressed"))
    return FileArchive;
  if (fileType.startsWith("text/")) return FileText;
  return FileType;
}

function labelFor(fileType: string): string {
  if (fileType.startsWith("image/")) return "Image";
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("video/")) return "Video";
  if (fileType.startsWith("audio/")) return "Audio";
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "Spreadsheet";
  if (fileType.includes("word")) return "Document";
  if (fileType === "application/zip" || fileType.includes("compressed"))
    return "Archive";
  if (fileType.startsWith("text/")) return "Text";
  return "File";
}

/**
 * Glass gallery of attachments. Images get a thumbnail preview; other files
 * get a lucide icon tile. Each item exposes a Download button that opens the
 * file in a new tab.
 */
export function AttachmentGallery({
  attachments,
  className,
}: {
  attachments: AttachmentRow[];
  className?: string;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Attachments
        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
          {attachments.length}
        </span>
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        {attachments.map((a) => {
          const image = isImageType(a.file_type);
          const Icon = iconFor(a.file_type);
          return (
            <li
              key={a.id}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-input/60 bg-card/40 p-3 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/60"
            >
              {image ? (
                // Preview the actual upload. We use a plain <img> because the
                // file lives under /uploads and is served as a static asset;
                // next/image would require explicit dimensions per file.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.file_path}
                  alt={a.file_name}
                  className="h-14 w-14 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Icon className="h-6 w-6" />
                </span>
              )}

              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium" title={a.file_name}>
                  {a.file_name}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {labelFor(a.file_type)}
                </p>
              </div>

              <Button asChild variant="ghost" size="icon" className="flex-shrink-0">
                <a
                  href={a.file_path}
                  target="_blank"
                  rel="noreferrer"
                  download={a.file_name}
                  aria-label={`Download ${a.file_name}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
