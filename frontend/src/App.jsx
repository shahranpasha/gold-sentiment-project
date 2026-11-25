import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import PageLayout from "./components/PageLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PriceChart from "./components/PriceChart.jsx";
import SentimentPanel from "./components/SentimentPanel.jsx";
import MacroGrid from "./components/MacroGrid.jsx";
import ModelPerformance from "./components/ModelPerformance.jsx";
import About from "./components/About.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-frame">
        <Navbar />
        <div className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/gold-price"
              element={
                <PageLayout
                  eyebrow="Market data"
                  title="Gold price"
                  description="Daily gold futures history, price movement, and technical averages."
                >
                  <PriceChart defaultPeriod="365" height={420} />
                </PageLayout>
              }
            />
            <Route
              path="/sentiment"
              element={
                <PageLayout
                  eyebrow="News intelligence"
                  title="Sentiment"
                  description="Daily national and international gold headlines alongside stored sentiment analysis."
                >
                  <SentimentPanel days={60} showNews height={280} />
                </PageLayout>
              }
            />
            <Route
              path="/economic-indicators"
              element={
                <PageLayout
                  eyebrow="Macro context"
                  title="Economic indicators"
                  description="Macroeconomic series used to study the conditions surrounding gold prices."
                >
                  <MacroGrid />
                </PageLayout>
              }
            />
            <Route
              path="/model-performance"
              element={
                <PageLayout
                  eyebrow="Model evaluation"
                  title="Model performance"
                  description="Current signal from the latest stored gold session, alongside clearly dated historical test results."
                >
                  <ModelPerformance />
                </PageLayout>
              }
            />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
