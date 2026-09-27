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
            Unable to load macroeconomic data
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
    <div className="w-full space-y-5 sm:space-y-6">

      {/* =====================================================
          MACRO METRIC CARDS
      ===================================================== */}

      <div className="relative w-full overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

        <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-[240px] w-[350px] rounded-full bg-[#c9a45b]/[0.022] blur-[90px] sm:h-[300px] sm:w-[450px] sm:blur-[100px]" />


        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <div className="relative flex flex-col gap-4 border-b border-white/[0.055] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045] sm:h-11 sm:w-11 lg:h-12 lg:w-12">

              <Landmark
                size={18}
                strokeWidth={1.4}
                className="text-[#c9a45b] sm:h-5 sm:w-5"
              />

            </div>


            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#e9e5dd] sm:text-lg lg:text-xl">
                  Economic indicators
                </h3>

                <span className="h-1 w-1 shrink-0 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62] sm:text-[10px]">
                  Macro Context
                </span>

              </div>


              <p className="mt-1 text-[11px] leading-5 text-[#60656c] sm:text-xs lg:text-[13px]">
                Current macroeconomic conditions used by the model
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2 self-start sm:self-auto">

            <Activity
              size={14}
              strokeWidth={1.4}
              className="text-[#51565c]"
            />

            <span className="text-[9px] uppercase tracking-[0.14em] text-[#51565c] sm:text-[10px]">
              {data.available.length} indicators
            </span>

          </div>

        </div>


        {/* ===================================================
            METRIC GRID
        =================================================== */}

        <div className="relative grid grid-cols-1 divide-y divide-white/[0.045] sm:grid-cols-2 sm:divide-x sm:divide-y lg:grid-cols-3">

          {data.available.map((c) => {

            const value = data.latest[c];

            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelected(c)}
                className={`
                  group
                  relative
                  w-full
                  text-left
                  px-4 py-5
                  transition-all duration-200
                  sm:px-5 sm:py-6
                  lg:px-6 lg:py-6
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
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-[#c9a45b]/50 sm:left-5 sm:right-5" />
                )}


                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#5b6066] sm:text-[10px]">
                      {LABELS[c] || c}
                    </p>


                    <p className="mt-2 font-mono text-[22px] font-medium tracking-[-0.02em] text-[#ded9d0] sm:text-[24px] lg:text-[26px]">
                      {value !== undefined && value !== null
                        ? value.toFixed(2)
                        : "—"}
                    </p>

                  </div>


                  <div
                    className={`
                      flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-lg
                      border
                      transition-all
                      sm:h-10 sm:w-10

                      ${
                        selected === c
                          ? "border-[#c9a45b]/15 bg-[#c9a45b]/[0.06]"
                          : "border-white/[0.05] bg-white/[0.018]"
                      }
                    `}
                  >

                    <TrendingUp
                      size={14}
                      strokeWidth={1.4}
                      className={
                        selected === c
                          ? "text-[#c9a45b]"
                          : "text-[#50565c]"
                      }
                    />

                  </div>

                </div>


                <div className="mt-4 flex items-center justify-between">

                  <span className="max-w-[65%] truncate font-mono text-[8px] uppercase tracking-[0.1em] text-[#42474c] sm:text-[9px]">
                    {c}
                  </span>


                  <span
                    className={`
                      text-[8px] uppercase tracking-[0.12em]
                      sm:text-[9px]

                      ${
                        selected === c
                          ? "text-[#c9a45b]/70"
                          : "text-[#41464b]"
                      }
                    `}
                  >
                    {selected === c
                      ? "Selected"
                      : "View history"}
                  </span>

                </div>

              </button>
            );
          })}

        </div>

      </div>


      {/* =====================================================
          INDICATOR HISTORY
      ===================================================== */}

      <div className="relative w-full overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

        <div className="pointer-events-none absolute left-1/3 top-[-140px] h-[240px] w-[420px] rounded-full bg-[#c9a45b]/[0.025] blur-[90px] sm:h-[280px] sm:w-[500px] sm:blur-[100px]" />


        {/* ===================================================
            CHART HEADER
        =================================================== */}

        <div className="relative border-b border-white/[0.055] px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            {/* Title */}

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

                  <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#e9e5dd] sm:text-lg lg:text-xl">
                    Indicator history
                  </h3>

                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#c9a45b]/70" />

                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62] sm:text-[10px]">
                    Historical Series
                  </span>

                </div>


                <p className="mt-1 text-[11px] leading-5 text-[#60656c] sm:text-xs lg:text-[13px]">
                  Historical movement of the selected macro indicator
                </p>

              </div>

            </div>


            {/* Current value */}

            <div className="flex items-center justify-between gap-4 sm:justify-end">

              <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

              <div className="text-left sm:text-right">

                <p className="text-[8px] uppercase tracking-[0.17em] text-[#51565c] sm:text-[9px]">
                  Current
                </p>

                <p className="mt-0.5 font-mono text-[16px] font-medium text-[#d7b66d] sm:text-[17px]">
                  {latestValue}
                </p>

              </div>


              <div className="rounded-lg border border-[#c9a45b]/10 bg-[#c9a45b]/[0.035] px-3 py-2">

                <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#c9a45b]/75 sm:text-[10px]">
                  {selectedLabel}
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              INDICATOR SELECTOR
          ================================================= */}

          <div className="mt-5 flex min-w-0 items-center gap-2 overflow-x-auto pb-1">

            <div className="hidden shrink-0 items-center gap-2 sm:flex">

              <CalendarRange
                size={14}
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
                    type="button"
                    onClick={() => setSelected(c)}
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-[9px]
                      font-medium
                      whitespace-nowrap
                      transition-all duration-200
                      sm:px-3.5
                      sm:py-2.5
                      sm:text-[10px]

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


        {/* ===================================================
            CHART
        =================================================== */}

        <div className="relative px-2 pb-4 pt-5 sm:px-4 sm:pb-5 sm:pt-6 lg:px-5">

          <div className="mb-3 flex flex-col gap-2 px-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-2">

              <span className="h-[2px] w-5 shrink-0 rounded-full bg-[#e8c558] sm:w-6" />

              <span className="text-[9px] uppercase tracking-[0.13em] text-[#60656c] sm:text-[10px]">
                {selectedLabel}
              </span>

            </div>


            <span className="font-mono text-[9px] text-[#464b51] sm:text-[10px]">
              Historical data
            </span>

          </div>


          <ResponsiveContainer
            width="100%"
            height={300}
            minWidth={0}
          >

            <LineChart
              data={chartRows}
              margin={{
                top: 8,
                right: 10,
                left: -8,
                bottom: 2,
              }}
            >

              <CartesianGrid
                stroke="rgba(201,164,91,0.065)"
                vertical={false}
              />


              {/* X Axis */}

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
                tickMargin={8}
              />


              {/* Y Axis */}

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
                tickMargin={4}
              />


              {/* Tooltip */}

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
                  padding: "11px 13px",
                  fontFamily: "IBM Plex Mono",
                  fontSize: 11,
                }}
                labelStyle={{
                  color: "#d8d3c9",
                  marginBottom: "6px",
                }}
                itemStyle={{
                  color: "#e8c558",
                  padding: "3px 0",
                }}
                formatter={(value) => [
                  typeof value === "number"
                    ? value.toFixed(2)
                    : value,
                  selectedLabel,
                ]}
              />


              {/* Main line */}

              <Line
                type="monotone"
                dataKey="value"
                stroke="#e8c558"
                dot={false}
                strokeWidth={2.3}
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


        {/* ===================================================
            CHART FOOTER
        =================================================== */}

        <div className="flex flex-col gap-2 border-t border-white/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />

            <span className="text-[9px] uppercase tracking-[0.14em] text-[#50565c] sm:text-[10px]">
              Data available
            </span>

          </div>


          <span className="font-mono text-[9px] text-[#464b51] sm:text-[10px]">
            {chartRows.length} observations
          </span>

        </div>

      </div>

    </div>
  );
}