import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const PAGES = [
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "About",
    path: "/about",
  },
  {
    name: "Gold Price",
    path: "/gold-price",
  },
  {
    name: "Sentiment",
    path: "/sentiment",
  },
  {
    name: "Economic Indicators",
    path: "/economic-indicators",
  },
  {
    name: "Model Performance",
    path: "/model-performance",
  },
];

export default function Navbar({ meta }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#0a0a0a]/95 backdrop-blur-xl">

      {/* ================= MAIN NAVBAR ================= */}

      <div className="flex min-h-[72px] w-full items-center justify-between px-4 sm:px-6 lg:min-h-[78px] lg:px-8">

        {/* ================= LOGO ================= */}

        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="w-auto shrink-0"
        >
          <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[#f1eee8] sm:text-[20px]">
            Gold Sentiment
          </h1>

          <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.25em] text-[#b08d4b] sm:text-[10px]">
            Research Ledger
          </span>
        </NavLink>

        {/* ================= DESKTOP NAVIGATION ================= */}

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">

          {PAGES.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative whitespace-nowrap rounded-lg
                px-3 py-3 xl:px-4
                text-[12px] xl:text-[13px]
                font-medium
                transition-all duration-200

                ${
                  isActive
                    ? "bg-[#c9a45b]/10 text-[#d7b66d]"
                    : "text-[#777a80] hover:bg-white/[0.035] hover:text-[#e5e2dc]"
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {item.name}

                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[#c9a45b]" />
                  )}
                </>
              )}
            </NavLink>
          ))}

        </nav>

        {/* ================= DESKTOP META ================= */}

        {meta && (
          <div className="hidden w-[250px] shrink-0 items-center justify-end gap-4 border-l border-white/[0.07] pl-5 xl:flex">

            <div className="text-right">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                Data
              </span>

              <span className="font-mono text-[9px] text-[#858990]">
                {meta.data_start} → {meta.data_end}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                Sequence
              </span>

              <span className="font-mono text-[10px] text-[#858990]">
                {meta.seq_len}d
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                Features
              </span>

              <span className="font-mono text-[10px] text-[#858990]">
                {meta.n_features}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                Threshold
              </span>

              <span className="font-mono text-[10px] text-[#c9a45b]">
                {meta.threshold?.toFixed(2)}
              </span>
            </div>

          </div>
        )}

        {/* ================= MOBILE MENU BUTTON ================= */}

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-lg
            border border-white/[0.08]
            bg-white/[0.025]
            text-[#c9a45b]
            transition-all duration-200
            hover:border-[#c9a45b]/30
            hover:bg-[#c9a45b]/10
            lg:hidden
          "
        >
          {mobileOpen ? (
            <X size={21} strokeWidth={1.6} />
          ) : (
            <Menu size={21} strokeWidth={1.6} />
          )}
        </button>

      </div>

      {/* ================= MOBILE MENU ================= */}

      <div
        className={`
          overflow-hidden
          border-t border-white/[0.06]
          transition-all duration-300 ease-in-out
          lg:hidden

          ${
            mobileOpen
              ? "max-h-[500px] opacity-100"
              : "max-h-0 border-t-0 opacity-0"
          }
        `}
      >

        <nav className="px-4 py-3 sm:px-6">

          <div className="flex flex-col gap-1">

            {PAGES.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  relative flex items-center
                  rounded-lg
                  px-4 py-3.5
                  text-[14px]
                  font-medium
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-[#c9a45b]/10 text-[#d7b66d]"
                      : "text-[#777a80] hover:bg-white/[0.035] hover:text-[#e5e2dc]"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <span>{item.name}</span>

                    {isActive && (
                      <span className="absolute left-0 h-5 w-[2px] rounded-full bg-[#c9a45b]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

          </div>

          {/* ================= MOBILE META ================= */}

          {meta && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">

              {/* Data */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">

                <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                  Data
                </span>

                <span className="mt-1 block truncate font-mono text-[9px] text-[#858990]">
                  {meta.data_start} → {meta.data_end}
                </span>

              </div>

              {/* Sequence */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">

                <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                  Sequence
                </span>

                <span className="mt-1 block font-mono text-[10px] text-[#858990]">
                  {meta.seq_len}d
                </span>

              </div>

              {/* Features */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">

                <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                  Features
                </span>

                <span className="mt-1 block font-mono text-[10px] text-[#858990]">
                  {meta.n_features}
                </span>

              </div>

              {/* Threshold */}
              <div className="rounded-lg border border-[#c9a45b]/10 bg-[#c9a45b]/[0.025] px-3 py-2.5">

                <span className="block text-[8px] uppercase tracking-[0.12em] text-[#555960]">
                  Threshold
                </span>

                <span className="mt-1 block font-mono text-[10px] text-[#c9a45b]">
                  {meta.threshold?.toFixed(2)}
                </span>

              </div>

            </div>
          )}

        </nav>

      </div>

    </header>
  );
}