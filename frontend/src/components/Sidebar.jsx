  const PAGES = [
    "Dashboard",
    "Gold Price",
    "Sentiment",
    "Economic Indicators",
    "Model Performance",
    "About",
  ];

  export default function Sidebar({ page, setPage, meta }) {
    return (
      <aside className="sidebar">
        <div className="sidebar-mark">
          Gold Sentiment
          <span>RESEARCH LEDGER</span>
        </div>

        <nav className="nav-list">
          {PAGES.map((p) => (
            <button
              key={p}
              className={`nav-item ${page === p ? "active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </nav>

        {meta && (
          <div className="sidebar-meta">
            <div>
              <b>Data</b> {meta.data_start} → {meta.data_end}
            </div>
            <div>
              <b>Sequence</b> {meta.seq_len}d
            </div>
            <div>
              <b>Features</b> {meta.n_features}
            </div>
            <div>
              <b>Threshold</b> {meta.threshold?.toFixed(2)}
            </div>
          </div>
        )}
      </aside>
    );
  }
