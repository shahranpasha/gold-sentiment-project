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
  Activity,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import { api } from "../api";

const PERIODS = [
  { key: "90", label: "90d" },
  { key: "180", label: "180d" },
  { key: "365", label: "1y" },
  { key: "all", label: "All" },
];

export default function PriceChart({
  defaultPeriod = "180",
  height = 320,
}) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setRows(null);
    setError(null);

    api
      .price(period)
      .then((d) => {
        if (cancelled) return;

        const merged = d.dates.map((date, i) => ({
          date,
          close: d.close[i],
          ma7: d.ma7[i],
          ma20: d.ma20[i],
        }));

        setRows(merged);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  /*
   * Responsive chart height.
   * The supplied height remains the desktop reference.
   */
  const chartHeight = height;

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0c0e10] sm:rounded-[24px]">

      {/* =====================================================
          AMBIENT GLOW
      ===================================================== */}

      <div className="pointer-events-none absolute left-1/3 top-[-130px] h-[240px] w-[420px] rounded-full bg-[#c9a45b]/[0.025] blur-[90px] sm:h-[280px] sm:w-[500px] sm:blur-[100px]" />


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="relative flex flex-col gap-4 border-b border-white/[0.055] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-6">

        {/* ===================================================
            TITLE
        =================================================== */}

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
                Gold price trend
              </h3>

              <span className="h-1 w-1 shrink-0 rounded-full bg-[#c9a45b]/70" />

              <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62] sm:text-[10px]">
                Market Data
              </span>

            </div>


            <p className="mt-1 text-[11px] leading-5 text-[#60656c] sm:text-xs lg:text-[13px]">
              Close price with moving-average indicators
            </p>

          </div>

        </div>


        {/* ===================================================
            PERIOD SELECTOR
        =================================================== */}

        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">

          <div className="flex shrink-0 items-center gap-2 text-[#4f555b]">

            <CalendarRange
              size={14}
              strokeWidth={1.4}
            />

            <span className="text-[9px] uppercase tracking-[0.15em] sm:text-[10px]">
              Period
            </span>

          </div>


          <div className="flex min-w-0 items-center gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">

            {PERIODS.map((p) => {

              const active = period === p.key;

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`
                    min-w-[48px]
                    rounded-lg
                    px-3 py-2
                    text-[10px] font-medium
                    transition-all duration-200
                    sm:min-w-[54px]
                    sm:px-3.5
                    sm:py-2.5
                    sm:text-[11px]

                    ${
                      active
                        ? "bg-[#c9a45b]/10 text-[#d3af60] shadow-[0_0_18px_rgba(201,164,91,0.04)]"
                        : "text-[#5f646b] hover:bg-white/[0.035] hover:text-[#a4a7aa]"
                    }
                  `}
                >
                  {p.label}
                </button>
              );
            })}

          </div>

        </div>

      </div>


      {/* =====================================================
          CHART BODY
      ===================================================== */}

      <div className="relative px-2 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5 lg:px-5 lg:pt-6">

        {/* ===================================================
            LEGEND
        =================================================== */}

        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 sm:mb-4 sm:px-3 lg:gap-x-6">

          <LegendItem
            label="Close"
            color="#e8c558"
          />

          <LegendItem
            label="MA7"
            color="#8fae72"
          />

          <LegendItem
            label="MA20"
            color="#c06a4e"
          />

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            style={{
              height: Math.max(chartHeight, 280),
            }}
            className="flex flex-col items-center justify-center px-5 text-center"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.04] sm:h-12 sm:w-12">

              <AlertCircle
                size={19}
                className="text-red-400/70"
                strokeWidth={1.4}
              />

            </div>


            <p className="mt-4 text-sm font-medium text-red-300/80 sm:text-base">
              Unable to load price data
            </p>


            <p className="mt-1 max-w-md break-words text-center font-mono text-[10px] leading-5 text-red-300/40 sm:text-[11px]">
              {error}
            </p>

          </div>
        )}


        {/* ===================================================
            LOADING
        =================================================== */}

        {!error && !rows && (
          <div
            style={{
              height: Math.max(chartHeight, 280),
            }}
            className="flex flex-col items-center justify-center"
          >

            <div className="relative h-9 w-9">

              <div className="absolute inset-0 rounded-full border border-[#c9a45b]/15" />

              <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#c9a45b]" />

            </div>


            <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#555a61] sm:text-[11px]">
              Loading market data
            </p>

          </div>
        )}


        {/* ===================================================
            CHART
        =================================================== */}

        {rows && (
          <div className="w-full min-w-0">

            <ResponsiveContainer
              width="100%"
              height={chartHeight}
              minWidth={0}
            >

              <LineChart
                data={rows}
                margin={{
                  top: 8,
                  right: 10,
                  left: -8,
                  bottom: 2,
                }}
              >

                <defs>

                  <linearGradient
                    id="goldLineGlow"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#e8c558"
                      stopOpacity="0.18"
                    />

                    <stop
                      offset="100%"
                      stopColor="#e8c558"
                      stopOpacity="0"
                    />

                  </linearGradient>

                </defs>


                <CartesianGrid
                  stroke="rgba(201,164,91,0.07)"
                  vertical={false}
                  horizontal={true}
                />


                {/* =================================================
                    X AXIS
                ================================================= */}

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
                  minTickGap={45}
                  tickMargin={8}
                />


                {/* =================================================
                    Y AXIS
                ================================================= */}

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


                {/* =================================================
                    TOOLTIP
                ================================================= */}

                <Tooltip
                  cursor={{
                    stroke: "rgba(201,164,91,0.25)",
                    strokeWidth: 1,
                  }}
                  contentStyle={{
                    background: "rgba(13,15,17,0.96)",
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
                    padding: "3px 0",
                  }}
                />


                {/* =================================================
                    CLOSE
                ================================================= */}

                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#e8c558"
                  dot={false}
                  strokeWidth={2.6}
                  name="Close"
                  activeDot={{
                    r: 4,
                    stroke: "#e8c558",
                    strokeWidth: 2,
                    fill: "#0c0e10",
                  }}
                />


                {/* =================================================
                    MA7
                ================================================= */}

                <Line
                  type="monotone"
                  dataKey="ma7"
                  stroke="#8fae72"
                  dot={false}
                  strokeWidth={1.6}
                  name="MA7"
                  strokeOpacity={0.9}
                />


                {/* =================================================
                    MA20
                ================================================= */}

                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#c06a4e"
                  dot={false}
                  strokeWidth={1.6}
                  name="MA20"
                  strokeOpacity={0.9}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>
        )}

      </div>


      {/* =====================================================
          BOTTOM STATUS
      ===================================================== */}

      {rows && (
        <div className="flex flex-col gap-2 border-t border-white/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />

            <span className="text-[9px] uppercase tracking-[0.14em] text-[#50565c] sm:text-[10px]">
              Market data loaded
            </span>

          </div>


          <span className="font-mono text-[9px] text-[#464b51] sm:text-[10px]">
            {rows.length} observations
          </span>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   LEGEND
========================================================= */

function LegendItem({ label, color }) {
  return (
    <div className="flex items-center gap-2">

      <span
        className="h-[2px] w-5 shrink-0 rounded-full sm:w-6"
        style={{
          backgroundColor: color,
        }}
      />

      <span className="text-[9px] uppercase tracking-[0.12em] text-[#60656c] sm:text-[10px]">
        {label}
      </span>

    </div>
  );
}