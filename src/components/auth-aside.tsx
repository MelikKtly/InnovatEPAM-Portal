import Link from "next/link";
import { Sparkles, ShieldCheck, Layers } from "lucide-react";

export function AuthAside({
  tagline,
}: {
  tagline?: string;
}) {
  return (
    <aside className="auth-aurora relative hidden flex-1 overflow-hidden text-white lg:flex">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-400/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />

      <div className="relative z-10 flex w-full flex-col justify-between p-12">
        <Link href="/" className="inline-flex items-center gap-2 self-start">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            InnovatEPAM
          </span>
        </Link>

        <div className="max-w-md space-y-6">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Where bold ideas
            <br />
            become <span className="text-gradient">real outcomes</span>.
          </h2>
          <p className="text-base text-white/70">
            {tagline ??
              "Capture, evaluate and ship innovation across EPAM — one idea at a time."}
          </p>

          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Layers className="h-4 w-4" />
              </span>
              Submit ideas with attachments in seconds.
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Transparent admin review with feedback trails.
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Sparkles className="h-4 w-4" />
              </span>
              Track status from submission to acceptance.
            </li>
          </ul>
        </div>

        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} InnovatEPAM — Innovation portal.
        </p>
      </div>
    </aside>
  );
}
