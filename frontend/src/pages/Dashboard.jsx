import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Newspaper,
  TrendingUp,
} from "lucide-react";

import Hero from "../components/Hero.jsx";
import PriceChart from "../components/PriceChart.jsx";
import SentimentPanel from "../components/SentimentPanel.jsx";
import { api } from "../api";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setDashboard)
      .catch((e) => setError(e.message));
  }, []);

  /* ================= ERROR ================= */

  if (error) {
    return (
      <div className="min-h-screen bg-[#070809] px-5 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/[0.04] p-8">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Connection Error
            </p>

            <h2 className="text-xl font-medium text-red-300">
              Backend connection failed
            </h2>

            <p className="mt-3 font-mono text-sm text-red-300/70">
              {error}
            </p>

            <p className="mt-5 text-xs text-red-300/40">
              Make sure the FastAPI server is running.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= LOADING ================= */

  if (!dashboard) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#070809]">
        <div className="text-center">

          <div className="relative mx-auto mb-5 h-10 w-10">
            <div className="absolute inset-0 rounded-full border border-[#c9a45b]/20" />

            <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#c9a45b]" />
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-[#666b72]">
            Loading research data
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070809] text-[#eeeae2]">

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#c9a45b]/[0.035] blur-[120px]" />

      <div className="pointer-events-none absolute right-[-200px] top-[600px] h-[500px] w-[500px] rounded-full bg-[#8b6b32]/[0.025] blur-[120px]" />


      <div className="relative mx-auto max-w-[1600px] px-5 pb-16 pt-7 sm:px-8 lg:px-10 lg:pt-10">


        {/* =====================================================
            TOP HEADER
        ===================================================== */}

        <section className="mb-9">

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">

            <div>

              <div className="mb-4 flex items-center gap-3">

                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#c9a45b]/40" />
                  <span className="relative h-2 w-2 rounded-full bg-[#c9a45b]" />
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a8894c]">
                  Research Dashboard
                </span>

              </div>


              <h1 className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-[#f4f0e8] sm:text-[46px] lg:text-[54px]">
                Gold Sentiment
              </h1>

              <p className="mt-4 max-w-xl text-[14px] leading-6 text-[#70757c] sm:text-[15px]">
                Deep-learning based analysis of gold price direction,
                financial-news sentiment, and macroeconomic signals.
              </p>

            </div>


            {/* STATUS */}

            <div className="flex items-center">

              <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 backdrop-blur-xl transition hover:border-[#c9a45b]/20">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06]">

                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.55)]" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#555b62]">
                      System
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#d7d3ca]">
                      Model Active
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[26px] border border-[#c9a45b]/10 bg-[#0c0e10] shadow-[0_30px_100px_rgba(0,0,0,0.28)]">

          {/* Gold glow */}

          <div className="pointer-events-none absolute right-[-100px] top-[-150px] h-[400px] w-[400px] rounded-full bg-[#c9a45b]/[0.045] blur-[100px]" />

          <div className="relative">
            <Hero data={dashboard} />
          </div>

        </section>


        {/* =====================================================
            MARKET OVERVIEW
        ===================================================== */}

        <section className="mt-12">

          <SectionHeading
            eyebrow="Market Overview"
            title="Price & market intelligence"
            icon={<BarChart3 size={19} strokeWidth={1.4} />}
          />


          <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_0.95fr]">


            {/* ================= PRICE CHART ================= */}

            <div className="group relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10] transition duration-300 hover:border-[#c9a45b]/15">

              {/* top glow */}

              <div className="pointer-events-none absolute left-1/4 top-[-100px] h-[220px] w-[400px] rounded-full bg-[#c9a45b]/[0.025] blur-[80px]" />

              <div className="relative flex items-center justify-between border-b border-white/[0.055] px-6 py-5 sm:px-7">

                <div>

                  <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ebe7df]">
                    Gold price trend
                  </h3>

                  <p className="mt-1.5 text-[11px] text-[#60656c]">
                    Historical movement with technical indicators
                  </p>

                </div>


                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">

                  <TrendingUp
                    size={18}
                    className="text-[#c9a45b]"
                    strokeWidth={1.4}
                  />

                </div>

              </div>


              <div className="relative p-3 sm:p-4">

                <PriceChart
                  defaultPeriod="180"
                  height={350}
                />

              </div>

            </div>


            {/* ================= SNAPSHOT ================= */}

            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">

              <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-[#c9a45b]/[0.025] blur-[80px]" />

              <div className="relative flex items-center justify-between border-b border-white/[0.055] px-6 py-5">

                <div>

                  <h3 className="text-[17px] font-medium text-[#ebe7df]">
                    Latest snapshot
                  </h3>

                  <p className="mt-1.5 text-[11px] text-[#60656c]">
                    Current model features
                  </p>

                </div>


                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">

                  <Activity
                    size={18}
                    className="text-[#c9a45b]"
                    strokeWidth={1.4}
                  />

                </div>

              </div>


              <div className="relative px-6 sm:px-7">

                <StatRow
                  label="MA7"
                  value={`$${dashboard.ma7?.toFixed(2) ?? "—"}`}
                />

                <StatRow
                  label="MA20"
                  value={`$${dashboard.ma20?.toFixed(2) ?? "—"}`}
                />

                <StatRow
                  label="Volatility"
                  value={dashboard.volatility?.toFixed(2) ?? "—"}
                />

                <StatRow
                  label="Momentum"
                  value={`${dashboard.momentum?.toFixed(2) ?? "—"}%`}
                  highlight
                />

                <StatRow
                  label="Sentiment score"
                  value={
                    dashboard.sentiment_score?.toFixed(3) ?? "0.000"
                  }
                  highlight
                />

                <StatRow
                  label="Relevant articles"
                  value={dashboard.article_count ?? 0}
                  last
                />

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SENTIMENT
        ===================================================== */}

        <section className="mt-12">

          <SectionHeading
            eyebrow="News Intelligence"
            title="FinBERT sentiment"
            icon={<Newspaper size={19} strokeWidth={1.4} />}
            right="Last 60 days"
          />


          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.16)] sm:p-4">

            <SentimentPanel
              days={60}
              showNews={false}
              height={250}
            />

          </div>

        </section>


        {/* =====================================================
            LIMITATION
        ===================================================== */}

        <section className="mt-12">

          <div className="relative overflow-hidden rounded-[24px] border border-[#c9a45b]/10 bg-[#0d0f10] px-6 py-6 sm:px-7">

            <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#c9a45b] via-[#c9a45b]/30 to-transparent" />

            <div className="absolute right-0 top-0 h-full w-[350px] bg-gradient-to-l from-[#c9a45b]/[0.025] to-transparent" />

            <div className="relative flex gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.05]">

                <BrainCircuit
                  size={19}
                  className="text-[#c9a45b]"
                  strokeWidth={1.4}
                />

              </div>


              <div className="flex-1">

                <div className="flex items-center justify-between">

                  <h3 className="text-sm font-medium text-[#ddd8ce]">
                    Dataset limitation
                  </h3>

                  <ArrowUpRight
                    size={17}
                    className="text-[#454a50]"
                  />

                </div>

                <p className="mt-2 max-w-5xl text-[12px] leading-6 text-[#6f747b]">
                  Relevant gold news is sparse on many trading days. On days
                  without detected news, sentiment features default to
                  zero/neutral, so the LSTM leans on technical and
                  macroeconomic features alongside sentiment.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FOOTER LINE
        ===================================================== */}

        <div className="mt-12 flex items-center justify-between border-t border-white/[0.05] pt-6">

          <p className="text-[9px] uppercase tracking-[0.2em] text-[#41464c]">
            Gold Sentiment Research
          </p>

          <p className="font-mono text-[9px] text-[#41464a]">
            DEEP LEARNING · FINBERT · LSTM
          </p>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  icon,
  right,
}) {
  return (
    <div className="flex items-end justify-between">

      <div>

        <div className="flex items-center gap-2">

          <span className="h-px w-5 bg-[#c9a45b]/60" />

          <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#a8894c]">
            {eyebrow}
          </p>

        </div>

        <div className="mt-2 flex items-center gap-3">

          <h2 className="text-[24px] font-medium tracking-[-0.025em] text-[#e9e5dd] sm:text-[27px]">
            {title}
          </h2>

          <div className="text-[#555b61]">
            {icon}
          </div>

        </div>

      </div>


      {right && (
        <span className="hidden text-[10px] uppercase tracking-[0.15em] text-[#50555b] sm:block">
          {right}
        </span>
      )}

    </div>
  );
}


/* =========================================================
   STAT ROW
========================================================= */

function StatRow({
  label,
  value,
  highlight = false,
  last = false,
}) {
  return (
    <div
      className={`
        group flex items-center justify-between py-[19px]
        ${
          !last
            ? "border-b border-white/[0.045]"
            : ""
        }
      `}
    >

      <span className="text-[13px] text-[#73787f] transition-colors group-hover:text-[#92969c] sm:text-sm">
        {label}
      </span>

      <span
        className={`
          font-mono text-[13px] font-medium sm:text-sm
          ${
            highlight
              ? "text-[#d1af61]"
              : "text-[#ddd9d1]"
          }
        `}
      >
        {value}
      </span>

    </div>
  );
}