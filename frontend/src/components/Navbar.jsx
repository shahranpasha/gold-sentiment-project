import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Coins, Menu, X } from "lucide-react";

const PAGES = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Gold Price", path: "/gold-price" },
  { name: "Sentiment", path: "/sentiment" },
  { name: "Economic Indicators", path: "/economic-indicators" },
  { name: "Model Performance", path: "/model-performance" },
  { name: "About", path: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-glint" />
      <div className="site-header-inner">
        <NavLink to="/dashboard" className="brand-lockup" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Coins size={20} strokeWidth={1.55} /></span>
          <span className="brand-copy">
            <strong>Gold Sentiment</strong>
            <small>Market intelligence</small>
          </span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Main navigation">
          {PAGES.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `desktop-nav-link${isActive ? " is-active" : ""}`}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="header-status">
          <span className="status-dot" />
          <span>Research mode</span>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`mobile-nav-wrap${mobileOpen ? " is-open" : ""}`}>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {PAGES.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `mobile-nav-link${isActive ? " is-active" : ""}`}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
