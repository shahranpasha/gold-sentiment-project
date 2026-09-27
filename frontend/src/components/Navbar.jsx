import { NavLink } from "react-router-dom";

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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#0a0a0a]">

      <div className="flex min-h-[78px] w-full items-center gap-6 px-6 lg:px-8">

        {/* ================= LOGO ================= */}

        <NavLink
          to="/dashboard"
          className="w-[180px] shrink-0"
        >
          <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#f1eee8]">
            Gold Sentiment
          </h1>

          <span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.28em] text-[#b08d4b]">
            Research Ledger
          </span>
        </NavLink>


        {/* ================= DESKTOP NAVIGATION ================= */}

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-1">

          {PAGES.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative whitespace-nowrap rounded-lg
                px-4 py-3
                text-[11px] font-medium
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


        {/* ================= META ================= */}

        {meta && (
          <div className="hidden w-[250px] shrink-0 items-center justify-end gap-4 border-l border-white/[0.07] pl-5 xl:flex">

            <div className="text-right">
              <span className="block text-[7px] uppercase tracking-[0.12em] text-[#555960]">
                Data
              </span>

              <span className="font-mono text-[8px] text-[#858990]">
                {meta.data_start} → {meta.data_end}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[7px] uppercase tracking-[0.12em] text-[#555960]">
                Sequence
              </span>

              <span className="font-mono text-[9px] text-[#858990]">
                {meta.seq_len}d
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[7px] uppercase tracking-[0.12em] text-[#555960]">
                Features
              </span>

              <span className="font-mono text-[9px] text-[#858990]">
                {meta.n_features}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[7px] uppercase tracking-[0.12em] text-[#555960]">
                Threshold
              </span>

              <span className="font-mono text-[9px] text-[#c9a45b]">
                {meta.threshold?.toFixed(2)}
              </span>
            </div>

          </div>
        )}

      </div>


      {/* ================= MOBILE NAVIGATION ================= */}

      <div className="overflow-x-auto border-t border-white/[0.05] px-4 py-2 lg:hidden">

        <nav className="flex min-w-max gap-1">

          {PAGES.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                whitespace-nowrap rounded-lg px-3 py-2
                text-[10px] font-medium
                transition-all

                ${
                  isActive
                    ? "bg-[#c9a45b]/10 text-[#d7b66d]"
                    : "text-[#777a80] hover:bg-white/[0.035] hover:text-white"
                }
              `}
            >
              {item.name}
            </NavLink>
          ))}

        </nav>

      </div>

    </header>
  );
}