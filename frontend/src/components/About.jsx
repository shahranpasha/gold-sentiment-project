import { useEffect, useState } from "react";
import {
  FlaskConical,
  Database,
  Newspaper,
  Globe2,
  BrainCircuit,
  Layers3,
  Target,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Settings2,
  BarChart3,
  Cpu,
  CheckCircle2,
  CalendarDays,
  GitBranch,
  Gauge,
} from "lucide-react";

import { api } from "../api";

export default function About() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    api.about().then(setCfg).catch(() => {});
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070809] text-[#eeeae2]">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute left-[-180px] top-[-180px] h-[520px] w-[520px] rounded-full bg-[#c9a45b]/[0.045] blur-[130px]" />

      <div className="pointer-events-none absolute right-[-150px] top-[300px] h-[450px] w-[450px] rounded-full bg-[#c9a45b]/[0.025] blur-[130px]" />


      <div className="relative mx-auto max-w-[1600px] px-5 pb-14 sm:px-8 lg:px-10">


        {/* =====================================================
            HERO HEADER
        ===================================================== */}

        <section className="relative overflow-hidden border-b border-white/[0.055] py-9 lg:py-11">

          <div className="absolute right-[-80px] top-[-160px] h-[400px] w-[400px] rounded-full bg-[#c9a45b]/[0.035] blur-[110px]" />

          <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-center">

            {/* LEFT */}

            <div className="flex items-start gap-5">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#c9a45b]/15 bg-[#c9a45b]/[0.06] shadow-[0_0_35px_rgba(201,164,91,0.05)]">

                <FlaskConical
                  size={23}
                  strokeWidth={1.4}
                  className="text-[#d2ad60]"
                />

              </div>


              <div>

                <div className="mb-3 flex items-center gap-3">

                  <span className="h-1.5 w-1.5 rounded-full bg-[#c9a45b] shadow-[0_0_10px_rgba(201,164,91,0.6)]" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#a8894c]">
                    Research Ledger
                  </span>

                  <span className="h-px w-8 bg-white/[0.08]" />

                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#50555b]">
                    System Documentation
                  </span>

                </div>


                <h1 className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-[#f2eee6] sm:text-[46px]">
                  Gold Sentiment
                </h1>


                <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#73787f] sm:text-[15px]">
                  Deep-learning research framework for analysing the
                  relationship between financial-news sentiment, market
                  behaviour and next-day gold price direction.
                </p>

              </div>

            </div>


            {/* STATUS */}

            <div className="flex items-center gap-3">

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4 backdrop-blur-xl">

                <div className="flex items-center gap-3">

                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]" />

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#555a61]">
                      Research System
                    </p>

                    <p className="mt-1 font-mono text-[11px] text-[#c4c7c9]">
                      ACTIVE
                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.035] px-5 py-4">

                <p className="text-[9px] uppercase tracking-[0.2em] text-[#756546]">
                  Version
                </p>

                <p className="mt-1 font-mono text-[11px] text-[#c9a45b]">
                  v1.0
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <div className="pt-9">


          {/* ===================================================
              OBJECTIVE + MODEL
          =================================================== */}

          <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">


            {/* OBJECTIVE */}

            <section className="group relative overflow-hidden rounded-[24px] border border-[#c9a45b]/10 bg-gradient-to-br from-[#15130e] via-[#0d0f11] to-[#090b0d] p-7 shadow-[0_25px_80px_rgba(0,0,0,0.18)] sm:p-8">

              <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-[#c9a45b]/[0.055] blur-[100px]" />

              <div className="relative">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.05]">

                    <Target
                      size={16}
                      className="text-[#c9a45b]"
                      strokeWidth={1.5}
                    />

                  </div>

                  <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#c9a45b]">
                    Research Objective
                  </span>

                </div>


                <h2 className="mt-7 max-w-4xl text-[25px] font-medium leading-[1.35] tracking-[-0.025em] text-[#eee9df] sm:text-[29px]">

                  Can financial sentiment and market indicators improve
                  next-day gold price direction forecasting?

                </h2>


                <p className="mt-5 max-w-4xl text-[13px] leading-7 text-[#777c83] sm:text-[14px]">
                  Gold Sentiment combines three information groups — technical
                  market behaviour, financial-news sentiment and macroeconomic
                  conditions. These features are processed as sequential
                  observations and supplied to an LSTM classification model.
                </p>


                <div className="mt-7 flex flex-wrap gap-2.5">

                  <ResearchTag
                    icon={BarChart3}
                    text="Market Data"
                  />

                  <ResearchTag
                    icon={Newspaper}
                    text="FinBERT Sentiment"
                  />

                  <ResearchTag
                    icon={Globe2}
                    text="Macro Indicators"
                  />

                  <ResearchTag
                    icon={BrainCircuit}
                    text="LSTM"
                  />

                </div>

              </div>

            </section>


            {/* MODEL SUMMARY */}

            <section className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">

              <div className="absolute right-[-80px] top-[-100px] h-[250px] w-[250px] rounded-full bg-[#c9a45b]/[0.025] blur-[90px]" />

              <SectionHeader
                icon={Cpu}
                title="Model Summary"
                subtitle="Architecture overview"
              />

              <div className="relative px-6 py-5 sm:px-7">

                <SummaryRow
                  label="Architecture"
                  value="2 × LSTM"
                />

                <SummaryRow
                  label="Hidden units"
                  value={cfg?.hidden_size ?? "64"}
                />

                <SummaryRow
                  label="Sequence"
                  value={`${cfg?.seq_len ?? "15"} days`}
                />

                <SummaryRow
                  label="Output"
                  value="UP / DOWN"
                />

                <SummaryRow
                  label="Regularization"
                  value={`Dropout ${cfg?.dropout ?? "0.2"}`}
                  last
                />

              </div>

            </section>

          </div>


          {/* ===================================================
              DATA PIPELINE
          =================================================== */}

          <section className="mt-6 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">

            <SectionHeader
              icon={GitBranch}
              title="Research Pipeline"
              subtitle="From raw data to prediction"
              right="DATA → FEATURES → MODEL → OUTPUT"
            />


            <div className="grid md:grid-cols-2 xl:grid-cols-4">

              <PipelineCard
                number="01"
                icon={Database}
                title="Market Data"
                text="Gold OHLC prices, volume, returns, moving averages, volatility and momentum."
                points={[
                  "Price history",
                  "Technical indicators",
                ]}
              />

              <PipelineCard
                number="02"
                icon={Newspaper}
                title="News Processing"
                text="Relevant financial news is classified with FinBERT to obtain sentiment signals."
                points={[
                  "Positive / negative / neutral",
                  "Confidence scores",
                ]}
              />

              <PipelineCard
                number="03"
                icon={Globe2}
                title="Macro Context"
                text="Economic indicators are merged with market and sentiment features."
                points={[
                  "Rates & inflation",
                  "GDP, PCE & Treasury yield",
                ]}
              />

              <PipelineCard
                number="04"
                icon={BrainCircuit}
                title="LSTM Prediction"
                text="A sequential deep-learning model learns temporal relationships."
                points={[
                  "15-day window",
                  "Next-day direction",
                ]}
                last
              />

            </div>

          </section>


          {/* ===================================================
              CONFIGURATION + DATASET
          =================================================== */}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">


            {/* CONFIG */}

            <section className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">

              <SectionHeader
                icon={Settings2}
                title="Current Model Configuration"
                subtitle="Runtime parameters"
              />


              <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-3">

                <ConfigItem
                  icon={Layers3}
                  label="Sequence"
                  value={cfg?.seq_len ?? "15"}
                  suffix="days"
                />

                <ConfigItem
                  icon={Database}
                  label="Features"
                  value={cfg?.n_features ?? "21"}
                />

                <ConfigItem
                  icon={BrainCircuit}
                  label="Hidden Size"
                  value={cfg?.hidden_size ?? "64"}
                />

                <ConfigItem
                  icon={Layers3}
                  label="LSTM Layers"
                  value={cfg?.lstm_layers ?? "2"}
                />

                <ConfigItem
                  icon={Gauge}
                  label="Dropout"
                  value={cfg?.dropout ?? "0.2"}
                />

                <ConfigItem
                  icon={Target}
                  label="Threshold"
                  value={
                    cfg?.threshold !== undefined
                      ? cfg.threshold.toFixed(2)
                      : "0.54"
                  }
                />

              </div>

            </section>


            {/* DATASET */}

            <section className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">

              <SectionHeader
                icon={Database}
                title="Research Dataset"
                subtitle="Input data coverage"
              />


              <div className="grid grid-cols-2">

                <DatasetItem
                  icon={CalendarDays}
                  label="Data Start"
                  value={cfg?.data_start ?? "2021-10-01"}
                />

                <DatasetItem
                  icon={CalendarDays}
                  label="Data End"
                  value={cfg?.data_end ?? "2026-08-24"}
                />

                <DatasetItem
                  icon={BarChart3}
                  label="Feature Groups"
                  value="03"
                />

                <DatasetItem
                  icon={GitBranch}
                  label="Prediction"
                  value="Next Day"
                />

              </div>

            </section>

          </div>


          {/* ===================================================
              LSTM ARCHITECTURE
          =================================================== */}

          <section className="mt-6 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">

            <SectionHeader
              icon={Cpu}
              title="LSTM Architecture"
              subtitle="Sequential classification workflow"
            />


            <div className="grid md:grid-cols-2 xl:grid-cols-5">

              <ArchitectureBlock
                number="01"
                title="Input"
                value="15 × Features"
                description="Historical sequential window"
              />

              <ArchitectureBlock
                number="02"
                title="LSTM Layer 01"
                value="64 Units"
                description="Temporal feature extraction"
              />

              <ArchitectureBlock
                number="03"
                title="LSTM Layer 02"
                value="64 Units"
                description="Sequential representation"
              />

              <ArchitectureBlock
                number="04"
                title="Dense Head"
                value="64 → 32"
                description="Classification representation"
              />

              <ArchitectureBlock
                number="05"
                title="Output"
                value="UP / DOWN"
                description="Next-day price direction"
                last
              />

            </div>

          </section>


          {/* ===================================================
              LIMITATION
          =================================================== */}

          <section className="mt-6 overflow-hidden rounded-[24px] border border-amber-500/10 bg-[#0d0e0e]">

            <div className="relative flex gap-4 p-6 sm:p-7">

              <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-amber-400/80 via-amber-400/30 to-transparent" />


              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/10 bg-amber-500/[0.05]">

                <AlertTriangle
                  size={18}
                  strokeWidth={1.4}
                  className="text-amber-400"
                />

              </div>


              <div>

                <h3 className="text-sm font-medium text-[#ddd6c8]">
                  Important Research Limitation
                </h3>

                <p className="mt-2 max-w-5xl text-[12px] leading-6 text-[#72777e] sm:text-[13px]">
                  Relevant gold news is not available for every trading day.
                  Therefore, some observations contain a zero or neutral
                  sentiment value. This represents a data-availability
                  limitation rather than a failure of the LSTM architecture.
                  The model combines sentiment with technical and
                  macroeconomic variables so that information from multiple
                  feature groups remains available when news coverage is
                  sparse.
                </p>

              </div>

            </div>

          </section>


          {/* ===================================================
              FOOTER
          =================================================== */}

          <footer className="mt-10 flex flex-col justify-between gap-4 border-t border-white/[0.055] pt-6 sm:flex-row sm:items-center">

            <div className="flex items-center gap-2.5">

              <ShieldCheck
                size={15}
                className="text-[#4f555b]"
                strokeWidth={1.4}
              />

              <p className="text-[10px] leading-5 text-[#555a60]">
                Academic & research purposes only. Predictions are not
                guaranteed trading signals or financial advice.
              </p>

            </div>


            <div className="flex items-center gap-2">

              <CheckCircle2
                size={13}
                className="text-emerald-500/60"
                strokeWidth={1.5}
              />

              <span className="text-[9px] uppercase tracking-[0.18em] text-[#4c5157]">
                Research Environment
              </span>

            </div>

          </footer>

        </div>

      </div>

    </main>
  );
}


/* =============================================================
   RESEARCH TAG
============================================================= */

function ResearchTag({ icon: Icon, text }) {
  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5 transition duration-200 hover:border-[#c9a45b]/15 hover:bg-[#c9a45b]/[0.035]">

      <Icon
        size={13}
        strokeWidth={1.5}
        className="text-[#c9a45b]"
      />

      <span className="text-[10px] text-[#858a90]">
        {text}
      </span>

    </div>
  );
}


/* =============================================================
   SUMMARY ROW
============================================================= */

function SummaryRow({
  label,
  value,
  last = false,
}) {
  return (
    <div
      className={`
        flex items-center justify-between py-4
        ${!last ? "border-b border-white/[0.045]" : ""}
      `}
    >

      <span className="text-[12px] text-[#6f747b]">
        {label}
      </span>

      <span className="font-mono text-[13px] font-medium text-[#d3d0c8]">
        {value}
      </span>

    </div>
  );
}


/* =============================================================
   SECTION HEADER
============================================================= */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.055] px-6 py-5">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">

          <Icon
            size={15}
            strokeWidth={1.4}
            className="text-[#c9a45b]"
          />

        </div>


        <div>

          <h2 className="text-[14px] font-medium text-[#ddd9d1] sm:text-[15px]">
            {title}
          </h2>

          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#4f545a]">
            {subtitle}
          </p>

        </div>

      </div>


      {right && (
        <span className="hidden font-mono text-[9px] tracking-[0.08em] text-[#44494f] lg:block">
          {right}
        </span>
      )}

    </div>
  );
}


/* =============================================================
   CONFIG ITEM
============================================================= */

function ConfigItem({
  icon: Icon,
  label,
  value,
  suffix,
}) {
  return (
    <div className="group bg-[#0c0e10] p-5 transition duration-200 hover:bg-white/[0.018]">

      <div className="flex items-center justify-between">

        <Icon
          size={14}
          strokeWidth={1.4}
          className="text-[#555b62]"
        />

        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a45b]/50" />

      </div>


      <p className="mt-5 text-[9px] uppercase tracking-[0.16em] text-[#555a61]">
        {label}
      </p>


      <div className="mt-2 flex items-baseline gap-1.5">

        <span className="font-mono text-[17px] font-medium text-[#d8d4cc]">
          {value}
        </span>

        {suffix && (
          <span className="text-[9px] text-[#555a60]">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}


/* =============================================================
   DATASET ITEM
============================================================= */

function DatasetItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="group border-b border-r border-white/[0.045] p-6 transition hover:bg-white/[0.015]">

      <div className="flex items-center gap-2.5">

        <Icon
          size={14}
          strokeWidth={1.4}
          className="text-[#c9a45b]"
        />

        <span className="text-[9px] uppercase tracking-[0.16em] text-[#555b62]">
          {label}
        </span>

      </div>


      <p className="mt-4 font-mono text-[15px] text-[#cbc7be]">
        {value}
      </p>

    </div>
  );
}


/* =============================================================
   PIPELINE CARD
============================================================= */

function PipelineCard({
  number,
  icon: Icon,
  title,
  text,
  points,
  last = false,
}) {
  return (
    <div
      className={`
        group relative p-6 transition duration-300
        hover:bg-white/[0.015]
        ${
          !last
            ? "border-b border-white/[0.055] xl:border-b-0 xl:border-r"
            : ""
        }
      `}
    >

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045] transition group-hover:border-[#c9a45b]/20">

          <Icon
            size={17}
            strokeWidth={1.4}
            className="text-[#c9a45b]"
          />

        </div>


        <span className="font-mono text-[10px] text-[#3f444a]">
          {number}
        </span>

      </div>


      <h3 className="mt-6 text-[14px] font-medium text-[#ddd9d1]">
        {title}
      </h3>


      <p className="mt-3 min-h-[62px] text-[11px] leading-5 text-[#6f747b]">
        {text}
      </p>


      <div className="mt-5 space-y-2">

        {points.map((point) => (
          <div
            key={point}
            className="flex items-center gap-2.5"
          >

            <span className="h-1 w-1 rounded-full bg-[#c9a45b]" />

            <span className="text-[10px] text-[#666b72]">
              {point}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}


/* =============================================================
   ARCHITECTURE BLOCK
============================================================= */

function ArchitectureBlock({
  number,
  title,
  value,
  description,
  last = false,
}) {
  return (
    <div
      className={`
        group relative p-6 transition duration-300
        hover:bg-white/[0.015]
        ${
          !last
            ? "border-b border-white/[0.055] md:border-r xl:border-b-0"
            : ""
        }
      `}
    >

      <div className="flex items-center justify-between">

        <span className="font-mono text-[10px] text-[#454a50]">
          {number}
        </span>

        <ArrowUpRight
          size={13}
          className="text-[#393e44] transition group-hover:text-[#c9a45b]"
        />

      </div>


      <p className="mt-6 text-[9px] uppercase tracking-[0.16em] text-[#62676e]">
        {title}
      </p>


      <p className="mt-2 font-mono text-[17px] font-medium text-[#c9a45b]">
        {value}
      </p>


      <p className="mt-2 text-[10px] leading-5 text-[#62676e]">
        {description}
      </p>

    </div>
  );
}