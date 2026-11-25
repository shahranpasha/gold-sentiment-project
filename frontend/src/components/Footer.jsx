import { NavLink } from "react-router-dom";
import { Coins } from "lucide-react";

const LINKS = [
  ["Dashboard", "/dashboard"],
  ["Gold price", "/gold-price"],
  ["Sentiment", "/sentiment"],
  ["Economic indicators", "/economic-indicators"],
  ["Model performance", "/model-performance"],
  ["About", "/about"],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <NavLink to="/dashboard" className="footer-brand">
          <span className="footer-mark"><Coins size={17} strokeWidth={1.6} /></span>
          <span>
            <strong>Gold Sentiment</strong>
            <small>Market research dashboard</small>
          </span>
        </NavLink>

        <nav aria-label="Footer navigation" className="footer-links">
          {LINKS.map(([label, to]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>

        <p className="footer-note">Research prototype <span>·</span> {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
