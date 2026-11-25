import { useEffect, useState } from "react";
import { Activity, Database, Newspaper } from "lucide-react";
import { api } from "../api";

const displayDate = (value) => value || "—";

export default function DataCoverage() {
  const [coverage, setCoverage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadCoverage = () => {
      api.dataCoverage().then((value) => {
        if (!cancelled) setCoverage(value);
      }).catch((e) => {
        if (!cancelled) setError(e.message);
      });
    };
    loadCoverage();
    const timer = window.setInterval(loadCoverage, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/15 bg-red-500/[0.035] p-5 text-sm text-red-300/70">
        Data coverage could not load: {error}
      </div>
    );
  }

  if (!coverage) {
    return (
      <div className="mt-6 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-[#777b81]">
        Loading data coverage…
      </div>
    );
  }

  const { gold, news, live_news: live = {} } = coverage;
  const imported = news.status === "imported";
  const hasLive = live.count > 0;
  const newsRange = imported
    ? `${displayDate(news.start)} → ${displayDate(news.end)}`
    : hasLive
    ? `${displayDate(live.start)} → ${displayDate(live.end)}`
    : `${displayDate(news.start)} → ${displayDate(news.end)}`;

  return (
    <section className="mt-10 sm:mt-12 lg:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-[#c9a45b]/60 sm:w-6" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a8894c] sm:text-[10px] lg:text-[11px]">
              Dataset Coverage
            </p>
          </div>
          <h2 className="mt-2 text-[23px] font-medium leading-tight tracking-[-0.025em] text-[#e9e5dd] sm:text-[27px] lg:text-[32px]">
            Gold &amp; news data
          </h2>
        </div>
        <Activity size={19} strokeWidth={1.4} className="mb-1 text-[#555b61]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <CoverageCard
          icon={<Database size={18} strokeWidth={1.4} />}
          eyebrow="Gold market history"
          title={`${gold.rows.toLocaleString()} daily bars`}
          range={`${displayDate(gold.start)} → ${displayDate(gold.end)}`}
          source={gold.source}
          detail={gold.latest_close != null ? `Latest close: $${Number(gold.latest_close).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Gold price file is not available."}
          status="Loaded"
        />

        <CoverageCard
          icon={<Newspaper size={18} strokeWidth={1.4} />}
          eyebrow={imported ? "Historical macro-news tone" : hasLive ? "Stored regional headlines" : "News currently available"}
          title={imported
            ? `${news.articles.toLocaleString()} articles · ${news.days.toLocaleString()} days`
            : `${live.national_count ?? 0} India · ${live.international_count ?? 0} international`}
          range={newsRange}
          source={imported ? news.source : hasLive ? live.source : "Existing recent news file"}
          detail={imported
            ? `${news.overlap_days.toLocaleString()} gold trading days overlap with the imported tone data.`
            : `${hasLive ? `${live.count} headlines stored; latest feed refresh ${live.updated_at ?? "recently"}. Gold update: ${coverage.pipelines?.gold_prices?.status ?? "waiting"}. ` : "The daily RSS feed has not returned headlines yet. "}Historical GDELT tone export remains separate; its archive starts ${coverage.historical_news_start}.`}
          status={imported ? "Imported" : hasLive ? "Live feed" : "Export needed"}
          pending={!imported}
        />
      </div>

      <p className="mt-3 px-1 text-[10px] leading-5 text-[#555b62] sm:text-[11px]">
        Daily records are stored in SQLite. The model signal uses gold inputs through {coverage.current_input_end ?? coverage.gold.end ?? "—"}; historical scored-news features currently end on {coverage.model_data_end ?? "—"}. Live RSS headlines remain unscored, and model weights are not retrained automatically.
      </p>
    </section>
  );
}

function CoverageCard({ icon, eyebrow, title, range, source, detail, status, pending = false }) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] p-5 sm:rounded-[24px] sm:p-6 lg:p-7">
      <div className="pointer-events-none absolute right-[-60px] top-[-90px] h-[180px] w-[180px] rounded-full bg-[#c9a45b]/[0.025] blur-[70px]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045] text-[#c9a45b]">
              {icon}
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#777b81] sm:text-[10px]">
              {eyebrow}
            </p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${pending ? "border-amber-400/15 bg-amber-400/[0.04] text-amber-200/70" : "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-200/70"}`}>
            {status}
          </span>
        </div>
        <p className="mt-5 text-[20px] font-medium tracking-[-0.025em] text-[#e9e5dd] sm:text-[23px]">
          {title}
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-[#b4a477] sm:text-xs">
          {range}
        </p>
        <div className="mt-4 border-t border-white/[0.055] pt-3">
          <p className="text-[10px] text-[#767b82] sm:text-[11px]">{source}</p>
          <p className="mt-2 text-[10px] leading-5 text-[#60656c] sm:text-[11px]">{detail}</p>
        </div>
      </div>
    </article>
  );
}
