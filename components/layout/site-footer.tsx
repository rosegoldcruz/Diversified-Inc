"use client";

/** Benchmark-style CTA band + footer. The CTA opens the voice companion. */
export function SiteFooter() {
  const talk = () => window.dispatchEvent(new CustomEvent("robot:open-mic"));
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#060d1a]/80 px-6 py-10 text-center shadow-[0_0_60px_rgba(34,211,238,0.12)] sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_16rem_at_50%_0%,rgba(1,125,213,0.35),transparent)]" />
        <p className="relative font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">Autonomous operations</p>
        <h2 className="relative mt-3 font-display text-2xl font-semibold text-white sm:text-4xl">
          Ask the robot. <span className="text-cyan-300 glow-text">It runs the floor.</span>
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-sm text-slate-300">
          Work orders, timesheets, inventory and SOPs — talk to your AI operator instead of clicking through menus.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={talk} className="rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.6)] transition hover:bg-cyan-300">
            Talk to the robot
          </button>
          <a href="/work-orders" className="rounded-full border border-cyan-400/40 px-6 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10">
            Open work orders
          </a>
        </div>
      </section>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-cyan-400/10 py-6 text-xs text-slate-400 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white/95 px-2 py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/online-autonomous.png" alt="Online Autonomous" className="h-6 w-auto" />
          </span>
          <span>© {year} Diversified Inc. All systems nominal.</span>
        </div>
        <nav className="flex gap-5">
          <a href="/sops" className="hover:text-cyan-300">SOPs</a>
          <a href="/reports" className="hover:text-cyan-300">Reports</a>
          <a href="/settings" className="hover:text-cyan-300">Settings</a>
        </nav>
      </div>
    </footer>
  );
}
