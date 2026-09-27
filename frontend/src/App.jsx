import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";

import Dashboard from "./pages/Dashboard.jsx";

import PriceChart from "./components/PriceChart.jsx";
import SentimentPanel from "./components/SentimentPanel.jsx";
import MacroGrid from "./components/MacroGrid.jsx";
import ModelPerformance from "./components/ModelPerformance.jsx";
import About from "./components/About.jsx";


export default function App() {
  return (
    <BrowserRouter>

      <div className="min-h-screen bg-[#08090b]">

        <Navbar />

        <Routes>

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/gold-price"
            element={
              <div className="p-8">
                <h1 className="mb-6 text-3xl text-white">
                  Gold Price
                </h1>

                <PriceChart
                  defaultPeriod="365"
                  height={420}
                />
              </div>
            }
          />

          <Route
            path="/sentiment"
            element={
              <div className="p-8">
                <h1 className="mb-6 text-3xl text-white">
                  Sentiment
                </h1>

                <SentimentPanel
                  days={60}
                  showNews={true}
                  height={280}
                />
              </div>
            }
          />

          <Route
            path="/economic-indicators"
            element={
              <div className="p-8">
                <h1 className="mb-6 text-3xl text-white">
                  Economic Indicators
                </h1>

                <MacroGrid />
              </div>
            }
          />

          <Route
            path="/model-performance"
            element={
              <div className="p-8">
                <h1 className="mb-6 text-3xl text-white">
                  Model Performance
                </h1>

                <ModelPerformance />
              </div>
            }
          />

          <Route
            path="/about"
            element={<About />}
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}