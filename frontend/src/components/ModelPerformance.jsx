import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Target,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { api } from "../api";

const pct = (v) =>
  v === null || v === undefined ? "N/A" : `${(v * 100).toFixed(2)}%`;

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .modelPerformance()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error) {
    return (
      <div className="relative w-full overflow-hidden rounded-[20px] border border-red-400/[0.10] bg-[#0c0e10] sm:rounded-[24px]">

        <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[240px] w-[320px] rounded-full bg-red-400/[0.018] blur-[90px]" />

        <div className="relative flex min-h-[280px] flex-col items-center justify-center px-5 text-center sm:min-h-[320px] sm:px-6">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.04] sm:h-12 sm:w-12">
            <AlertCircle
              size={19}
              strokeWidth={1.4}
              className="text-red-400/70"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-red-300/80 sm:text-base">
            Unable to load model metrics
          </p>

          <p className="mt-1 max-w-md break-words text-center font-mono text-[10px] leading-5 text-red-300/40 sm:text-[11px]">
            {error}
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (!data) {
    return (
      <div className="relative w-full overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

        <div className="flex min-h-[280px] flex-col items-center justify-center sm:min-h-[320px]">

          <div className="relative h-9 w-9">

            <div className="absolute inset-0 rounded-full border border-[#c9a45b]/15" />

            <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#c9a45b]" />

          </div>

          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#555a61] sm:text-[11px]">
            Loading model metrics
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 sm:space-y-6">

      {/* =====================================================
          MODEL PERFORMANCE HEADER
      ===================================================== */}

      <div className="relative w-full overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

        <div className="pointer-events-none absolute right-[-120px] top-[-150px] h-[260px] w-[400px] rounded-full bg-[#c9a45b]/[0.025] blur-[100px] sm:h-[320px] sm:w-[500px] sm:blur-[110px]" />

        <div className="relative flex flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-7">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045] sm:h-11 sm:w-11 lg:h-12 lg:w-12">

              <BarChart3
                size={18}
                strokeWidth={1.4}
                className="text-[#c9a45b] sm:h-5 sm:w-5"
              />

            </div>


            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-[18px] font-medium tracking-[-0.02em] text-[#e9e5dd] sm:text-xl lg:text-2xl">
                  Model performance
                </h2>

                <span className="h-1 w-1 shrink-0 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62] sm:text-[10px]">
                  Evaluation
                </span>

              </div>


              <p className="mt-1 text-[11px] leading-5 text-[#60656c] sm:text-xs lg:text-[13px]">
                Held-out test metrics and recent directional predictions
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2 self-start sm:self-auto">

            <Activity
              size={14}
              strokeWidth={1.4}
              className="text-[#50565c]"
            />

            <span className="text-[9px] uppercase tracking-[0.15em] text-[#50565c] sm:text-[10px]">
              LSTM Evaluation
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          METRIC CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">

        <MetricCard
          label="Test accuracy"
          value={pct(data.test_accuracy)}
          icon={Target}
          featured
        />

        <MetricCard
          label="Balanced accuracy"
          value={pct(data.balanced_accuracy)}
          icon={Activity}
        />

        <MetricCard
          label="Macro F1"
          value={pct(data.macro_f1)}
          icon={BarChart3}
        />

        <MetricCard
          label="ROC-AUC"
          value={data.roc_auc?.toFixed(4) ?? "N/A"}
          icon={Trophy}
        />

        <MetricCard
          label="Validation macro F1"
          value={pct(data.validation_macro_f1)}
          icon={CheckCircle2}
        />

      </div>


      {/* =====================================================
          TEST SET SUMMARY
      ===================================================== */}

      {data.correct !== null && (
        <div className="relative w-full overflow-hidden rounded-[20px] border border-[#c9a45b]/10 bg-[#0c0e10] sm:rounded-[22px]">

          <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-[220px] w-[300px] rounded-full bg-[#c9a45b]/[0.018] blur-[80px]" />

          <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/10 bg-emerald-400/[0.035] sm:h-10 sm:w-10">

                <CheckCircle2
                  size={16}
                  strokeWidth={1.4}
                  className="text-emerald-400/70"
                />

              </div>


              <div className="min-w-0">

                <p className="text-[12px] font-medium text-[#cbc7bf] sm:text-[13px]">
                  Held-out test set
                </p>

                <p className="mt-1 text-[9px] text-[#555b61] sm:text-[10px]">
                  Directional prediction results
                </p>

              </div>

            </div>


            <div className="flex items-center gap-3 pl-[52px] sm:pl-0">

              <span className="font-mono text-[21px] font-medium text-[#d7b66d] sm:text-[23px]">
                {data.correct}
              </span>

              <span className="text-[10px] text-[#3d4247]">
                /
              </span>

              <span className="font-mono text-[15px] text-[#73787e] sm:text-[17px]">
                {data.total}
              </span>

              <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-[#50565c]">
                correct calls
              </span>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          RECENT PREDICTIONS
      ===================================================== */}

      <div className="relative w-full overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

        <div className="pointer-events-none absolute right-[-120px] top-[-130px] h-[240px] w-[350px] rounded-full bg-[#c9a45b]/[0.018] blur-[90px] sm:h-[280px] sm:w-[420px] sm:blur-[100px]" />


        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="relative flex flex-col gap-4 border-b border-white/[0.055] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045] sm:h-11 sm:w-11 lg:h-12 lg:w-12">

              <Activity
                size={18}
                strokeWidth={1.4}
                className="text-[#c9a45b] sm:h-5 sm:w-5"
              />

            </div>


            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="text-[17px] font-medium text-[#e9e5dd] sm:text-lg lg:text-xl">
                  Recent test predictions
                </h3>

                <span className="h-1 w-1 shrink-0 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62] sm:text-[10px]">
                  Test Set
                </span>

              </div>


              <p className="mt-1 text-[11px] leading-5 text-[#60656c] sm:text-xs lg:text-[13px]">
                Actual versus predicted directional calls
              </p>

            </div>

          </div>


          {data.predictions.length > 0 && (
            <div className="self-start rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">

              <span className="font-mono text-[9px] text-[#656a70] sm:text-[10px]">
                {Math.min(data.predictions.length, 20)} recent
              </span>

            </div>
          )}

        </div>


        {/* ===================================================
            PREDICTION ROWS
        =================================================== */}

        <div className="relative">

          {data.predictions.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center sm:min-h-[220px] sm:px-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] sm:h-12 sm:w-12">

                <BarChart3
                  size={19}
                  strokeWidth={1.3}
                  className="text-[#555b62]"
                />

              </div>


              <p className="mt-4 text-sm text-[#858990] sm:text-base">
                No prediction data available
              </p>


              <p className="mt-1 text-center font-mono text-[10px] leading-5 text-[#4f545a] sm:text-[11px]">
                Models/test_predictions.csv was not found.
              </p>

            </div>
          )}


          {data.predictions.slice(0, 20).map((row, i) => {

            const actual = String(row.actual).toUpperCase();
            const prediction = String(row.prediction).toUpperCase();

            const correct = actual === prediction;

            return (
              <div
                key={i}
                className="
                  group
                  flex flex-col gap-4
                  border-b border-white/[0.045]
                  px-4 py-4
                  transition-colors duration-200
                  last:border-b-0
                  hover:bg-white/[0.018]
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-6 sm:py-5
                  lg:px-7
                "
              >

                {/* =================================================
                    DATE
                ================================================= */}

                <div className="flex items-center gap-3">

                  <span className="hidden w-7 font-mono text-[9px] text-[#41464b] sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>


                  <div>

                    <p className="font-mono text-[10px] text-[#aaa59d] sm:text-[11px]">
                      {row.date}
                    </p>

                    <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-[#474c51] sm:text-[9px]">
                      Prediction
                    </p>

                  </div>

                </div>


                {/* =================================================
                    ACTUAL / PREDICTED
                ================================================= */}

                <div className="flex items-end justify-between gap-3 sm:justify-end sm:gap-4">

                  <PredictionBadge
                    label="Actual"
                    value={actual}
                  />


                  <span className="mb-2 text-[10px] text-[#3d4247]">
                    →
                  </span>


                  <PredictionBadge
                    label="Predicted"
                    value={prediction}
                  />


                  <div
                    className={`
                      mb-1 ml-1
                      flex h-7 w-7 shrink-0
                      items-center justify-center
                      rounded-lg border
                      sm:h-8 sm:w-8

                      ${
                        correct
                          ? "border-emerald-400/10 bg-emerald-400/[0.035]"
                          : "border-red-400/10 bg-red-400/[0.035]"
                      }
                    `}
                  >

                    {correct ? (
                      <CheckCircle2
                        size={13}
                        strokeWidth={1.5}
                        className="text-emerald-400/70"
                      />
                    ) : (
                      <span className="text-[10px] text-red-400/60">
                        ×
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })}

        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        {data.predictions.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-white/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-7">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a45b]/80" />

              <span className="text-[9px] uppercase tracking-[0.14em] text-[#50565c] sm:text-[10px]">
                Prediction records
              </span>

            </div>


            <span className="font-mono text-[9px] text-[#464b51] sm:text-[10px]">
              Showing {Math.min(data.predictions.length, 20)} /{" "}
              {data.predictions.length}
            </span>

          </div>
        )}

      </div>

    </div>
  );
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  icon: Icon,
  featured = false,
}) {
  return (
    <div
      className={`
        group
        relative
        min-w-0
        overflow-hidden
        rounded-[18px]
        border
        bg-[#0c0e10]
        px-4 py-5
        transition-all duration-200
        hover:bg-[#0e1012]
        sm:rounded-[20px]
        sm:px-5 sm:py-5

        ${
          featured
            ? "border-[#c9a45b]/15"
            : "border-white/[0.07]"
        }
      `}
    >

      <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-[130px] w-[130px] rounded-full bg-[#c9a45b]/[0.025] blur-[45px]" />


      <div className="relative flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="truncate text-[9px] uppercase tracking-[0.14em] text-[#5b6066] sm:text-[10px]">
            {label}
          </p>


          <p
            className={`
              mt-3
              font-mono
              text-[22px]
              font-medium
              tracking-[-0.03em]
              sm:text-[24px]

              ${
                featured
                  ? "text-[#d9b968]"
                  : "text-[#d8d4cc]"
              }
            `}
          >
            {value}
          </p>

        </div>


        <div
          className={`
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-lg border
            sm:h-10 sm:w-10

            ${
              featured
                ? "border-[#c9a45b]/12 bg-[#c9a45b]/[0.045]"
                : "border-white/[0.05] bg-white/[0.018]"
            }
          `}
        >

          <Icon
            size={14}
            strokeWidth={1.4}
            className={
              featured
                ? "text-[#c9a45b]"
                : "text-[#555b61]"
            }
          />

        </div>

      </div>


      <div className="relative mt-4 h-px w-full bg-white/[0.04]">

        <div
          className={`
            h-px w-1/3
            transition-all duration-300
            group-hover:w-1/2

            ${
              featured
                ? "bg-[#c9a45b]/50"
                : "bg-white/[0.08]"
            }
          `}
        />

      </div>

    </div>
  );
}


/* =========================================================
   PREDICTION BADGE
========================================================= */

function PredictionBadge({ label, value }) {

  const isUp =
    value === "UP" ||
    value === "1" ||
    value === "POSITIVE";

  const isDown =
    value === "DOWN" ||
    value === "0" ||
    value === "NEGATIVE";

  return (
    <div className="min-w-[68px] sm:min-w-[72px]">

      <p className="mb-1 text-[7px] uppercase tracking-[0.12em] text-[#44494e] sm:text-[8px]">
        {label}
      </p>


      <div
        className={`
          rounded-lg
          border
          px-2.5 py-1.5
          text-center
          sm:px-3 sm:py-2

          ${
            isUp
              ? "border-emerald-400/10 bg-emerald-400/[0.035] text-emerald-300/75"
              : isDown
              ? "border-red-400/10 bg-red-400/[0.035] text-red-300/75"
              : "border-white/[0.06] bg-white/[0.02] text-[#858a90]"
          }
        `}
      >

        <span className="font-mono text-[9px] font-medium sm:text-[10px]">
          {value}
        </span>

      </div>

    </div>
  );
}