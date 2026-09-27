export default function Hero({ data }) {
  if (!data) return null;

  const isUp = data.prediction === "UP";

  return (
    <div className="hero">
      <div>
        <div className="hero-price-label">Latest gold close</div>
        <div className="hero-price">
          ${Number(data.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          <small>USD / oz</small>
        </div>
        <div className="hero-date">as of {data.date}</div>
      </div>

      <div className="hero-call">
        <span className={`badge ${isUp ? "up" : "down"}`}>
          {isUp ? "▲ UP" : "▼ DOWN"} — next session
        </span>
        <div className="hero-confidence">
          confidence {(data.confidence * 100).toFixed(1)}% · P(up)&nbsp;
          {(data.probability_up * 100).toFixed(1)}% · threshold {data.threshold.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
