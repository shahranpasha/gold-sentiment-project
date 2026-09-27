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
    api.modelPerformance().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-red-400/[0.10] bg-[#0c0e10]">
        <div className="flex min-h-[280px] flex-col items-center justify-center px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.04]">
            <AlertCircle
              size={19}
              strokeWidth={1.4}
              className="text-red-400/70"
            />
          </div>

          <p className="mt-4 text-sm text-red-300/80">
            Unable to load model metrics
          </p>

          <p className="mt-1 max-w-md text-center font-mono text-[10px] text-red-300/40">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
        <div className="flex min-h-[280px] flex-col items-center justify-center">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full border border-[#c9a45b]/15" />
            <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#c9a45b]" />
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#555a61]">
            Loading model metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* =========================================
          MODEL PERFORMANCE HEADER
      ========================================= */}

      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
        <div className="pointer-events-none absolute right-[-120px] top-[-150px] h-[320px] w-[500px] rounded-full bg-[#c9a45b]/[0.025] blur-[110px]" />

        <div className="relative flex flex-col gap-4 px-5 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">
              <BarChart3
                size={18}
                strokeWidth={1.4}
                className="text-[#c9a45b]"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-medium tracking-[-0.02em] text-[#e9e5dd]">
                  Model performance
                </h2>

                <span className="h-1 w-1 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62]">
                  Evaluation
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[#60656c]">
                Held-out test metrics and recent directional predictions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity
              size={13}
              strokeWidth={1.4}
              className="text-[#50565c]"
            />

            <span className="text-[9px] uppercase tracking-[0.15em] text-[#50565c]">
              LSTM Evaluation
            </span>
          </div>
        </div>
      </div>

      {/* =========================================
          METRIC CARDS
      ========================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      {/* =========================================
          TEST SET SUMMARY
      ========================================= */}

      {data.correct !== null && (
        <div className="relative overflow-hidden rounded-[20px] border border-[#c9a45b]/10 bg-[#0c0e10]">
          <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-[220px] w-[300px] rounded-full bg-[#c9a45b]/[0.018] blur-[80px]" />

          <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/10 bg-emerald-400/[0.035]">
                <CheckCircle2
                  size={16}
                  strokeWidth={1.4}
                  className="text-emerald-400/70"
                />
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#cbc7bf]">
                  Held-out test set
                </p>

                <p className="mt-1 text-[9px] text-[#555b61]">
                  Directional prediction results
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[20px] font-medium text-[#d7b66d]">
                {data.correct}
              </span>

              <span className="text-[10px] text-[#484d52]">/</span>

              <span className="font-mono text-[15px] text-[#73787e]">
                {data.total}
              </span>

              <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-[#50565c]">
                correct calls
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          RECENT PREDICTIONS
      ========================================= */}

      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
        <div className="pointer-events-none absolute right-[-120px] top-[-130px] h-[280px] w-[420px] rounded-full bg-[#c9a45b]/[0.018] blur-[100px]" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.055] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">
              <Activity
                size={17}
                strokeWidth={1.4}
                className="text-[#c9a45b]"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-medium text-[#e9e5dd]">
                  Recent test predictions
                </h3>

                <span className="h-1 w-1 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62]">
                  Test Set
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[#60656c]">
                Actual versus predicted directional calls
              </p>
            </div>
          </div>

          {data.predictions.length > 0 && (
            <div className="hidden rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 sm:block">
              <span className="font-mono text-[9px] text-[#656a70]">
                {Math.min(data.predictions.length, 20)} recent
              </span>
            </div>
          )}
        </div>

        {/* Prediction rows */}
        <div className="relative">
          {data.predictions.length === 0 && (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <BarChart3
                  size={18}
                  strokeWidth={1.3}
                  className="text-[#555b62]"
                />
              </div>

              <p className="mt-4 text-sm text-[#858990]">
                No prediction data available
              </p>

              <p className="mt-1 text-center font-mono text-[10px] text-[#4f545a]">
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
                className="group flex flex-col gap-3 border-b border-white/[0.045] px-5 py-4 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.018] sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                {/* Date */}
                <div className="flex items-center gap-3">
                  <span className="w-7 font-mono text-[9px] text-[#41464b]">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <p className="font-mono text-[10px] text-[#aaa59d]">
                      {row.date}
                    </p>

                    <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-[#474c51]">
                      Prediction
                    </p>
                  </div>
                </div>

                {/* Actual / predicted */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <PredictionBadge
                    label="Actual"
                    value={actual}
                  />

                  <span className="text-[10px] text-[#3d4247]">
                    →
                  </span>

                  <PredictionBadge
                    label="Predicted"
                    value={prediction}
                  />

                  <div
                    className={`
                      ml-1 flex h-7 w-7 items-center justify-center rounded-lg border
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

        {/* Footer */}
        {data.predictions.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.045] px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a45b]/80" />

              <span className="text-[9px] uppercase tracking-[0.14em] text-[#50565c]">
                Prediction records
              </span>
            </div>

            <span className="font-mono text-[9px] text-[#464b51]">
              Showing {Math.min(data.predictions.length, 20)} /{" "}
              {data.predictions.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================
   METRIC CARD
========================================= */

function MetricCard({
  label,
  value,
  icon: Icon,
  featured = false,
}) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-[20px]
        border bg-[#0c0e10]
        px-5 py-5
        transition-all duration-200
        hover:bg-[#0e1012]
        ${
          featured
            ? "border-[#c9a45b]/15"
            : "border-white/[0.07]"
        }
      `}
    >
      <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-[130px] w-[130px] rounded-full bg-[#c9a45b]/[0.025] blur-[45px]" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-[#5b6066]">
            {label}
          </p>

          <p
            className={`
              mt-3 font-mono text-[21px] font-medium tracking-[-0.03em]
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
            flex h-9 w-9 items-center justify-center rounded-lg border
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
            h-px w-1/3 transition-all duration-300
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

/* =========================================
   PREDICTION BADGE
========================================= */

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
    <div className="min-w-[70px]">
      <p className="mb-1 text-[7px] uppercase tracking-[0.12em] text-[#44494e]">
        {label}
      </p>

      <div
        className={`
          rounded-lg border px-2.5 py-1.5 text-center
          ${
            isUp
              ? "border-emerald-400/10 bg-emerald-400/[0.035] text-emerald-300/75"
              : isDown
              ? "border-red-400/10 bg-red-400/[0.035] text-red-300/75"
              : "border-white/[0.06] bg-white/[0.02] text-[#858a90]"
          }
        `}
      >
        <span className="font-mono text-[9px] font-medium">
          {value}
        </span>
      </div>
    </div>
  );
}