import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Landmark,
  Activity,
  TrendingUp,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import { api } from "../api";

const LABELS = {
  Federal_Funds_Rate: "Fed funds rate",
  CPI: "CPI",
  Unemployment: "Unemployment",
  GDP: "GDP",
  PCE: "PCE",
  Treasury10Y: "10Y treasury",
};

export default function MacroGrid() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .macro()
      .then((d) => {
        setData(d);
        setSelected(d.available[0]);
      })
      .catch((e) => setError(e.message));
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
            Unable to load macroeconomic data
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
            Loading macro data
          </p>
        </div>
      </div>
    );
  }

  const chartRows = data.series.dates.map((date, i) => ({
    date,
    value: selected ? data.series[selected][i] : null,
  }));

  const selectedLabel = selected
    ? LABELS[selected] || selected
    : "Indicator";

  const latestValue =
    selected && data.latest[selected] !== undefined
      ? data.latest[selected]?.toFixed(2)
      : "—";

  return (
    <div className="space-y-5">
      {/* =========================================
          MACRO METRIC CARDS
      ========================================= */}

      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
        <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-[300px] w-[450px] rounded-full bg-[#c9a45b]/[0.022] blur-[100px]" />

        {/* Section Header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.055] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">
              <Landmark
                size={17}
                strokeWidth={1.4}
                className="text-[#c9a45b]"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-medium tracking-[-0.01em] text-[#e9e5dd]">
                  Economic indicators
                </h3>

                <span className="h-1 w-1 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62]">
                  Macro Context
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[#60656c]">
                Current macroeconomic conditions used by the model
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Activity
              size={13}
              strokeWidth={1.4}
              className="text-[#51565c]"
            />

            <span className="text-[9px] uppercase tracking-[0.14em] text-[#51565c]">
              {data.available.length} indicators
            </span>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="relative grid grid-cols-1 divide-y divide-white/[0.045] sm:grid-cols-2 sm:divide-x sm:divide-y lg:grid-cols-3">
          {data.available.map((c, index) => {
            const value = data.latest[c];

            return (
              <button
                key={c}
                onClick={() => setSelected(c)}
                className={`
                  group relative text-left
                  px-5 py-5
                  transition-all duration-200
                  hover:bg-white/[0.018]
                  ${
                    selected === c
                      ? "bg-[#c9a45b]/[0.025]"
                      : ""
                  }
                `}
              >
                {/* Active indicator */}
                {selected === c && (
                  <span className="absolute bottom-0 left-5 right-5 h-px bg-[#c9a45b]/50" />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#5b6066]">
                      {LABELS[c] || c}
                    </p>

                    <p className="mt-2 font-mono text-[20px] font-medium tracking-[-0.02em] text-[#ded9d0]">
                      {value !== undefined && value !== null
                        ? value.toFixed(2)
                        : "—"}
                    </p>
                  </div>

                  <div
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-lg
                      border transition-all
                      ${
                        selected === c
                          ? "border-[#c9a45b]/15 bg-[#c9a45b]/[0.06]"
                          : "border-white/[0.05] bg-white/[0.018]"
                      }
                    `}
                  >
                    <TrendingUp
                      size={13}
                      strokeWidth={1.4}
                      className={
                        selected === c
                          ? "text-[#c9a45b]"
                          : "text-[#50565c]"
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#42474c]">
                    {c}
                  </span>

                  <span
                    className={`
                      text-[8px] uppercase tracking-[0.12em]
                      ${
                        selected === c
                          ? "text-[#c9a45b]/70"
                          : "text-[#41464b]"
                      }
                    `}
                  >
                    {selected === c ? "Selected" : "View history"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================
          INDICATOR HISTORY
      ========================================= */}

      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
        <div className="pointer-events-none absolute left-1/3 top-[-140px] h-[280px] w-[500px] rounded-full bg-[#c9a45b]/[0.025] blur-[100px]" />

        {/* Chart Header */}
        <div className="relative flex flex-col gap-5 border-b border-white/[0.055] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">
                <Activity
                  size={17}
                  strokeWidth={1.4}
                  className="text-[#c9a45b]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium tracking-[-0.01em] text-[#e9e5dd]">
                    Indicator history
                  </h3>

                  <span className="h-1 w-1 rounded-full bg-[#c9a45b]/70" />

                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62]">
                    Historical Series
                  </span>
                </div>

                <p className="mt-1 text-[10px] text-[#60656c]">
                  Historical movement of the selected macro indicator
                </p>
              </div>
            </div>

            {/* Selected indicator value */}
            <div className="flex items-center gap-3">
              <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

              <div className="text-right">
                <p className="text-[8px] uppercase tracking-[0.17em] text-[#51565c]">
                  Current
                </p>

                <p className="mt-0.5 font-mono text-[15px] font-medium text-[#d7b66d]">
                  {latestValue}
                </p>
              </div>

              <div className="rounded-lg border border-[#c9a45b]/10 bg-[#c9a45b]/[0.035] px-3 py-2">
                <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#c9a45b]/75">
                  {selectedLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Indicator selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <CalendarRange
                size={13}
                strokeWidth={1.4}
                className="text-[#4f555b]"
              />

              <span className="mr-2 text-[9px] uppercase tracking-[0.15em] text-[#4f555b]">
                Indicator
              </span>
            </div>

            <div className="flex min-w-max items-center gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
              {data.available.map((c) => {
                const active = selected === c;

                return (
                  <button
                    key={c}
                    onClick={() => setSelected(c)}
                    className={`
                      rounded-lg px-3 py-2
                      text-[9px] font-medium
                      transition-all duration-200
                      ${
                        active
                          ? "bg-[#c9a45b]/10 text-[#d3af60] shadow-[0_0_18px_rgba(201,164,91,0.04)]"
                          : "text-[#5f646b] hover:bg-white/[0.035] hover:text-[#a4a7aa]"
                      }
                    `}
                  >
                    {LABELS[c] || c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative px-2 pb-4 pt-5 sm:px-4">
          <div className="mb-3 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-5 rounded-full bg-[#e8c558]" />

              <span className="text-[9px] uppercase tracking-[0.13em] text-[#60656c]">
                {selectedLabel}
              </span>
            </div>

            <span className="font-mono text-[9px] text-[#464b51]">
              Historical data
            </span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartRows}
              margin={{
                top: 8,
                right: 12,
                left: -8,
                bottom: 2,
              }}
            >
              <CartesianGrid
                stroke="rgba(201,164,91,0.065)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{
                  fill: "#666b72",
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={{
                  stroke: "rgba(255,255,255,0.05)",
                }}
                tickLine={false}
                minTickGap={50}
              />

              <YAxis
                domain={["auto", "auto"]}
                tick={{
                  fill: "#666b72",
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                width={58}
              />

              <Tooltip
                cursor={{
                  stroke: "rgba(201,164,91,0.25)",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  background: "rgba(13,15,17,0.97)",
                  border: "1px solid rgba(201,164,91,0.18)",
                  borderRadius: "12px",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
                  padding: "10px 12px",
                  fontFamily: "IBM Plex Mono",
                  fontSize: 11,
                }}
                labelStyle={{
                  color: "#d8d3c9",
                  marginBottom: "6px",
                }}
                itemStyle={{
                  color: "#e8c558",
                  padding: "2px 0",
                }}
                formatter={(value) => [
                  typeof value === "number"
                    ? value.toFixed(2)
                    : value,
                  selectedLabel,
                ]}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#e8c558"
                dot={false}
                strokeWidth={2.2}
                name={selectedLabel}
                activeDot={{
                  r: 4,
                  stroke: "#e8c558",
                  strokeWidth: 2,
                  fill: "#0c0e10",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.045] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />

            <span className="text-[9px] uppercase tracking-[0.14em] text-[#50565c]">
              Data available
            </span>
          </div>

          <span className="font-mono text-[9px] text-[#464b51]">
            {chartRows.length} observations
          </span>
        </div>
      </div>
    </div>
  );
}