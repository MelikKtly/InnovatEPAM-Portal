import { Badge } from "@/components/ui/badge";
import type { IdeaStatus } from "@/lib/db";

const VARIANT: Record<IdeaStatus, "blue" | "yellow" | "green" | "red"> = {
  submitted: "blue",
  "under review": "yellow",
  accepted: "green",
  rejected: "red",
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}
