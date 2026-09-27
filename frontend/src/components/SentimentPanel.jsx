import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react";
import { api } from "../api";

export default function SentimentPanel({
  days = 60,
  showNews = true,
  height = 260,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .sentiment(days)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [days]);

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-red-400/[0.10] bg-[#0c0e10]">
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.04]">
            <AlertCircle
              size={19}
              strokeWidth={1.4}
              className="text-red-400/70"
            />
          </div>

          <p className="mt-4 text-sm text-red-300/80">
            Unable to load sentiment data
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
        <div className="flex min-h-[260px] flex-col items-center justify-center">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full border border-[#c9a45b]/15" />
            <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#c9a45b]" />
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#555a61]">
            Loading sentiment data
          </p>
        </div>
      </div>
    );
  }

  const chartRows = [...data.daily].reverse();

  const average =
    data.average_sentiment !== null
      ? data.average_sentiment.toFixed(3)
      : "—";

  const sentimentValue = Number(data.average_sentiment);

  const sentimentType =
    sentimentValue > 0.05
      ? "Positive"
      : sentimentValue < -0.05
      ? "Negative"
      : "Neutral";

  return (
    <div className="space-y-5">
      {/* SENTIMENT CHART */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute right-[-120px] top-[-140px] h-[300px] w-[420px] rounded-full bg-[#c9a45b]/[0.025] blur-[100px]" />

        {/* Header */}
        <div className="relative flex flex-col gap-5 border-b border-white/[0.055] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
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
                  FinBERT sentiment
                </h3>

                <span className="h-1 w-1 rounded-full bg-[#c9a45b]/70" />

                <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62]">
                  NLP Analysis
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[#60656c]">
                Daily aggregated financial-news sentiment
              </p>
            </div>
          </div>

          {/* Average sentiment */}
          <div className="flex items-center gap-3">
            <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.17em] text-[#51565c]">
                Average
              </p>

              <p className="mt-0.5 font-mono text-[15px] font-medium text-[#d7b66d]">
                {average}
              </p>
            </div>

            <SentimentBadge type={sentimentType} />
          </div>
        </div>

        {/* Chart */}
        <div className="relative px-2 pb-5 pt-5 sm:px-4">
          <div className="mb-3 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-5 rounded-full bg-[#e8c558]" />

              <span className="text-[9px] uppercase tracking-[0.13em] text-[#60656c]">
                Sentiment Score
              </span>
            </div>

            <span className="font-mono text-[9px] text-[#464b51]">
              Range −1.0 / +1.0
            </span>
          </div>

          <ResponsiveContainer width="100%" height={height}>
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
                minTickGap={45}
              />

              <YAxis
                domain={[-1, 1]}
                tick={{
                  fill: "#666b72",
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                width={42}
              />

              {/* Neutral sentiment line */}
              <ReferenceLine
                y={0}
                stroke="rgba(201,164,91,0.28)"
                strokeDasharray="4 5"
              />

              <Tooltip
                cursor={{
                  stroke: "rgba(201,164,91,0.22)",
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
              />

              <Line
                type="monotone"
                dataKey="sentiment_score"
                stroke="#e8c558"
                dot={false}
                strokeWidth={2}
                name="Sentiment"
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

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.045] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c9a45b]/80" />

            <span className="text-[9px] uppercase tracking-[0.14em] text-[#50565c]">
              FinBERT analysis
            </span>
          </div>

          <span className="font-mono text-[9px] text-[#464b51]">
            {chartRows.length} days
          </span>
        </div>
      </div>

      {/* NEWS */}
      {showNews && (
        <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0c0e10]">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute left-[-120px] top-[-140px] h-[280px] w-[400px] rounded-full bg-[#c9a45b]/[0.018] blur-[100px]" />

          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-white/[0.055] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a45b]/10 bg-[#c9a45b]/[0.045]">
                <Newspaper
                  size={17}
                  strokeWidth={1.4}
                  className="text-[#c9a45b]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium text-[#e9e5dd]">
                    Latest news
                  </h3>

                  <span className="h-1 w-1 rounded-full bg-[#c9a45b]/70" />

                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#555b62]">
                    News Feed
                  </span>
                </div>

                <p className="mt-1 text-[10px] text-[#60656c]">
                  Articles contributing to sentiment analysis
                </p>
              </div>
            </div>

            {data.news.length > 0 && (
              <div className="hidden rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 sm:block">
                <span className="font-mono text-[9px] text-[#656a70]">
                  {data.news.length} articles
                </span>
              </div>
            )}
          </div>

          {/* News body */}
          <div className="relative">
            {data.news.length === 0 && (
              <div className="flex min-h-[180px] flex-col items-center justify-center px-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <Newspaper
                    size={18}
                    strokeWidth={1.3}
                    className="text-[#555b62]"
                  />
                </div>

                <p className="mt-4 text-sm text-[#858990]">
                  No news articles found
                </p>

                <p className="mt-1 text-center text-[10px] text-[#4f545a]">
                  No articles were found in sentiment_news.csv.
                </p>
              </div>
            )}

            {data.news.map((n, i) => (
              <NewsItem key={i} news={n} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------
   SENTIMENT BADGE
--------------------------------------- */

function SentimentBadge({ type }) {
  const config = {
    Positive: {
      icon: TrendingUp,
      className:
        "border-emerald-400/10 bg-emerald-400/[0.045] text-emerald-300/75",
    },
    Negative: {
      icon: TrendingDown,
      className:
        "border-red-400/10 bg-red-400/[0.045] text-red-300/75",
    },
    Neutral: {
      icon: Minus,
      className:
        "border-white/[0.07] bg-white/[0.025] text-[#8a8e93]",
    },
  };

  const item = config[type] || config.Neutral;
  const Icon = item.icon;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 ${item.className}`}
    >
      <Icon size={12} strokeWidth={1.5} />

      <span className="text-[9px] font-medium uppercase tracking-[0.1em]">
        {type}
      </span>
    </div>
  );
}

/* ---------------------------------------
   NEWS ITEM
--------------------------------------- */

function NewsItem({ news: n, index }) {
  const sentiment = n.sentiment?.toLowerCase();

  const sentimentConfig =
    sentiment === "positive"
      ? {
          className:
            "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300/70",
          dot: "bg-emerald-400/80",
        }
      : sentiment === "negative"
      ? {
          className:
            "border-red-400/10 bg-red-400/[0.04] text-red-300/70",
          dot: "bg-red-400/80",
        }
      : {
          className:
            "border-white/[0.07] bg-white/[0.025] text-[#858a90]",
          dot: "bg-[#858a90]/60",
        };

  return (
    <div
      className={`
        group relative flex gap-4 border-b border-white/[0.045]
        px-5 py-4 transition-all duration-200
        last:border-b-0
        hover:bg-white/[0.018]
        sm:px-6
      `}
    >
      {/* Index */}
      <div className="hidden w-7 shrink-0 pt-1 sm:block">
        <span className="font-mono text-[9px] text-[#41464b]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <span
                className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${sentimentConfig.dot}`}
              />

              <div className="min-w-0">
                <div className="text-[12px] font-medium leading-5 text-[#d6d2cb] transition-colors group-hover:text-[#eeeae2]">
                  {n.url ? (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-start gap-1.5 hover:text-[#d7b66d]"
                    >
                      <span>{n.title}</span>

                      <ExternalLink
                        size={11}
                        strokeWidth={1.4}
                        className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-70"
                      />
                    </a>
                  ) : (
                    n.title
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-[9px] text-[#555a60]">
                    {n.date}
                  </span>

                  {n.source && (
                    <>
                      <span className="text-[#3d4247]">·</span>

                      <span className="text-[9px] uppercase tracking-[0.08em] text-[#555a60]">
                        {n.source}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment tag */}
          {n.sentiment && (
            <span
              className={`
                inline-flex shrink-0 items-center gap-1.5 self-start
                rounded-lg border px-2.5 py-1.5
                text-[8px] font-medium uppercase tracking-[0.12em]
                ${sentimentConfig.className}
              `}
            >
              <span
                className={`h-1 w-1 rounded-full ${sentimentConfig.dot}`}
              />
              {n.sentiment}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}