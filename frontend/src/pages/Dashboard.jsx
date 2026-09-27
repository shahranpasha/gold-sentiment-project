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

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#070809] px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-10 lg:py-14 xl:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 sm:rounded-[24px] sm:p-8 lg:p-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400 sm:text-xs">
              Connection Error
            </p>

            <h2 className="text-xl font-medium text-red-300 sm:text-2xl lg:text-3xl">
              Backend connection failed
            </h2>

            <p className="mt-3 break-words font-mono text-sm leading-6 text-red-300/70 sm:text-base">
              {error}
            </p>

            <p className="mt-5 text-xs leading-5 text-red-300/40 sm:text-sm">
              Make sure the FastAPI server is running.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (!dashboard) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center overflow-x-hidden bg-[#070809] px-5">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-12 w-12">
            <div className="absolute inset-0 rounded-full border border-[#c9a45b]/20" />

            <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#c9a45b]" />
          </div>

          <p className="text-[11px] uppercase tracking-[0.2em] text-[#666b72] sm:text-xs">
            Loading research data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#070809] text-[#eeeae2]">

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-[#c9a45b]/[0.035] blur-[100px] sm:h-[450px] sm:w-[800px] lg:h-[550px] lg:w-[1000px] lg:blur-[130px]" />

      <div className="pointer-events-none absolute right-[-180px] top-[600px] h-[400px] w-[400px] rounded-full bg-[#8b6b32]/[0.025] blur-[100px] lg:h-[550px] lg:w-[550px] lg:blur-[130px]" />


      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <div className="relative mx-auto w-full max-w-[1700px] px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8 md:px-8 lg:px-10 lg:pt-12 xl:px-12 2xl:px-16">


        {/* =====================================================
            TOP HEADER
        ===================================================== */}

        <section className="mb-8 sm:mb-10 lg:mb-12">

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end lg:gap-10">

            {/* TITLE */}

            <div className="min-w-0">

              <div className="mb-4 flex items-center gap-3 sm:mb-5">

                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#c9a45b]/40" />

                  <span className="relative h-2.5 w-2.5 rounded-full bg-[#c9a45b]" />
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a8894c] sm:text-[11px] lg:text-xs">
                  Research Dashboard
                </span>

              </div>


              <h1 className="text-[40px] font-semibold leading-[0.95] tracking-[-0.045em] text-[#f4f0e8] sm:text-[48px] md:text-[54px] lg:text-[64px] xl:text-[68px]">
                Gold Sentiment
              </h1>


              <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#70757c] sm:text-[16px] sm:leading-7 lg:mt-5 lg:text-[17px] lg:leading-8">
                Deep-learning based analysis of gold price direction,
                financial-news sentiment, and macroeconomic signals.
              </p>

            </div>


            {/* STATUS */}

            <div className="flex w-full lg:w-auto">

              <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 backdrop-blur-xl transition hover:border-[#c9a45b]/20 sm:px-6 sm:py-5 lg:min-w-[220px]">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06]">

                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.55)]" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#555b62] sm:text-[10px]">
                      System
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#d7d3ca] sm:text-base lg:text-[17px]">
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

        <section className="relative overflow-hidden rounded-[20px] border border-[#c9a45b]/10 bg-[#0c0e10] shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:rounded-[24px] lg:rounded-[30px]">

          <div className="pointer-events-none absolute right-[-100px] top-[-150px] h-[350px] w-[350px] rounded-full bg-[#c9a45b]/[0.045] blur-[90px] sm:h-[400px] sm:w-[400px] lg:blur-[110px]" />

          <div className="relative">
            <Hero data={dashboard} />
          </div>

        </section>


        {/* =====================================================
            MARKET OVERVIEW
        ===================================================== */}

        <section className="mt-10 sm:mt-12 lg:mt-16">

          <SectionHeading
            eyebrow="Market Overview"
            title="Price & market intelligence"
            icon={<BarChart3 size={20} strokeWidth={1.4} />}
          />


          <div className="mt-5 grid gap-5 sm:mt-6 lg:gap-6 xl:grid-cols-[1.7fr_0.95fr]">


            {/* ================= PRICE CHART ================= */}

            <div className="group relative min-w-0 overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] transition duration-300 hover:border-[#c9a45b]/15 sm:rounded-[24px]">

              <div className="pointer-events-none absolute left-1/4 top-[-100px] h-[220px] w-[400px] rounded-full bg-[#c9a45b]/[0.025] blur-[80px]" />


              <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.055] px-5 py-5 sm:px-7 sm:py-6 lg:px-8">

                <div className="min-w-0">

                  <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ebe7df] sm:text-lg lg:text-xl">
                    Gold price trend
                  </h3>

                  <p className="mt-1.5 text-[11px] leading-5 text-[#60656c] sm:text-xs lg:text-sm">
                    Historical movement with technical indicators
                  </p>

                </div>


                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045] sm:h-11 sm:w-11">

                  <TrendingUp
                    size={19}
                    className="text-[#c9a45b]"
                    strokeWidth={1.4}
                  />

                </div>

              </div>


              <div className="relative p-2.5 sm:p-4 lg:p-5">

                <div className="w-full overflow-hidden">
                  <PriceChart
                    defaultPeriod="180"
                    height={350}
                  />
                </div>

              </div>

            </div>


            {/* ================= SNAPSHOT ================= */}

            <div className="relative min-w-0 overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

              <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-[#c9a45b]/[0.025] blur-[80px]" />


              <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.055] px-5 py-5 sm:px-7 sm:py-6 lg:px-8">

                <div className="min-w-0">

                  <h3 className="text-[17px] font-medium text-[#ebe7df] sm:text-lg lg:text-xl">
                    Latest snapshot
                  </h3>

                  <p className="mt-1.5 text-[11px] text-[#60656c] sm:text-xs lg:text-sm">
                    Current model features
                  </p>

                </div>


                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] sm:h-11 sm:w-11">

                  <Activity
                    size={19}
                    className="text-[#c9a45b]"
                    strokeWidth={1.4}
                  />

                </div>

              </div>


              <div className="relative px-5 sm:px-7 lg:px-8">

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

        <section className="mt-10 sm:mt-12 lg:mt-16">

          <SectionHeading
            eyebrow="News Intelligence"
            title="FinBERT sentiment"
            icon={<Newspaper size={20} strokeWidth={1.4} />}
            right="Last 60 days"
          />


          <div className="mt-5 overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] p-2.5 shadow-[0_20px_70px_rgba(0,0,0,0.16)] sm:mt-6 sm:rounded-[24px] sm:p-4 lg:p-5">

            <div className="w-full overflow-hidden">

              <SentimentPanel
                days={60}
                showNews={false}
                height={250}
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            LIMITATION
        ===================================================== */}

        <section className="mt-10 sm:mt-12 lg:mt-16">

          <div className="relative overflow-hidden rounded-[20px] border border-[#c9a45b]/10 bg-[#0d0f10] px-5 py-5 sm:rounded-[24px] sm:px-7 sm:py-7 lg:px-8 lg:py-8">

            <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#c9a45b] via-[#c9a45b]/30 to-transparent" />

            <div className="absolute right-0 top-0 h-full w-[250px] bg-gradient-to-l from-[#c9a45b]/[0.025] to-transparent sm:w-[350px]" />


            <div className="relative flex gap-4 sm:gap-5">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.05] sm:h-12 sm:w-12">

                <BrainCircuit
                  size={20}
                  className="text-[#c9a45b]"
                  strokeWidth={1.4}
                />

              </div>


              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-4">

                  <h3 className="text-sm font-medium text-[#ddd8ce] sm:text-base lg:text-lg">
                    Dataset limitation
                  </h3>

                  <ArrowUpRight
                    size={18}
                    className="shrink-0 text-[#454a50]"
                  />

                </div>


                <p className="mt-2 max-w-5xl text-[12px] leading-6 text-[#6f747b] sm:text-[13px] sm:leading-7 lg:text-[14px]">

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

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.05] pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between lg:mt-16">

          <p className="text-[9px] uppercase tracking-[0.2em] text-[#41464c] sm:text-[10px]">
            Gold Sentiment Research
          </p>

          <p className="font-mono text-[9px] text-[#41464a] sm:text-[10px]">
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
    <div className="flex items-end justify-between gap-4">

      <div className="min-w-0">

        <div className="flex items-center gap-2">

          <span className="h-px w-5 shrink-0 bg-[#c9a45b]/60 sm:w-6" />

          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a8894c] sm:text-[10px] lg:text-[11px]">
            {eyebrow}
          </p>

        </div>


        <div className="mt-2 flex items-center gap-3">

          <h2 className="text-[23px] font-medium leading-tight tracking-[-0.025em] text-[#e9e5dd] sm:text-[27px] md:text-[30px] lg:text-[32px] xl:text-[34px]">
            {title}
          </h2>

          <div className="shrink-0 text-[#555b61]">
            {icon}
          </div>

        </div>

      </div>


      {right && (
        <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.15em] text-[#50555b] sm:block lg:text-[11px]">
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
        group flex min-w-0 items-center justify-between gap-4 py-4
        sm:py-[19px]
        lg:py-[21px]

        ${
          !last
            ? "border-b border-white/[0.045]"
            : ""
        }
      `}
    >

      <span className="min-w-0 text-[13px] text-[#73787f] transition-colors group-hover:text-[#92969c] sm:text-sm lg:text-[15px]">
        {label}
      </span>


      <span
        className={`
          shrink-0 font-mono text-[13px] font-medium sm:text-sm lg:text-[15px]
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