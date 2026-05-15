import {
  CircuitBoard,
  Cog,
  HandshakeIcon,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

import type { IdeaCategory } from "@/lib/idea-constants";

type Meta = {
  icon: LucideIcon;
  /** Tailwind gradient classes for the icon tile. */
  tile: string;
  /** Soft halo behind the tile. */
  halo: string;
};

const CATEGORY_META: Record<IdeaCategory, Meta> = {
  "Technical Innovation": {
    icon: CircuitBoard,
    tile: "bg-[linear-gradient(135deg,#4f46e5,#0ea5e9)]",
    halo: "bg-indigo-500/20",
  },
  "Process Improvement": {
    icon: Cog,
    tile: "bg-[linear-gradient(135deg,#10b981,#22d3ee)]",
    halo: "bg-emerald-500/20",
  },
  "Client Solutions": {
    icon: HandshakeIcon,
    tile: "bg-[linear-gradient(135deg,#ec4899,#f97316)]",
    halo: "bg-fuchsia-500/20",
  },
  "Cost Reduction": {
    icon: PiggyBank,
    tile: "bg-[linear-gradient(135deg,#a855f7,#6366f1)]",
    halo: "bg-purple-500/20",
  },
};

export function categoryMeta(category: IdeaCategory): Meta {
  return CATEGORY_META[category];
}
