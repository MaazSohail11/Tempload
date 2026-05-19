import React, { Suspense } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { BackgroundBeams } from "./components/ui/BackgroundBeams.jsx";
import NavTabs from "./components/ui/NavTabs.jsx";
import LogoSVG from "./components/ui/LogoSVG.jsx";

// Lazy-loaded routes
const UploadPage = React.lazy(() => import("./pages/UploadPage.jsx"));
const DownloadPage = React.lazy(() => import("./pages/DownloadPage.jsx"));
const SharePage = React.lazy(() => import("./pages/SharePage.jsx"));

// Lazy-loaded heavy components
const SparklesCore = React.lazy(() => import("./components/ui/SparklesCore.jsx"));

const NAV_TABS = [
  { title: "Upload", value: "/" },
  { title: "Receive", value: "/download" },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSharePage = location.pathname.startsWith("/v/");
  const activeTab = location.pathname === "/download" ? "/download" : "/";

  return (
    <>
      {/* Animated SVG Beams background */}
      <BackgroundBeams />

      {/* Global Navigation Header (hidden on share pages) */}
      {!isSharePage && (
        <header className="app-header">
          <div className="header-container">
            <Link to="/" className="logo">
              <div className="logo-sparkle-wrapper">
                <LogoSVG style={{ position: "relative", zIndex: 1, height: "70px", width: "auto" }} />
                <div className="logo-sparkle-area">
                  <Suspense fallback={null}>
                    <SparklesCore
                      background="transparent"
                      minSize={0.4}
                      maxSize={1}
                      particleDensity={200}
                      particleColor="#FFFFFF"
                      speed={3}
                    />
                  </Suspense>
                </div>
                <div className="logo-gradient-line" />
                <div className="logo-gradient-line-glow" />
              </div>
            </Link>
            <NavTabs
              tabs={NAV_TABS}
              activeValue={activeTab}
              onTabChange={(value) => navigate(value)}
            />
          </div>
        </header>
      )}

      <Suspense fallback={
        <div className="app-container" style={{ textAlign: "center", paddingTop: "100px" }}>
          <div className="loading-spinner" style={{ margin: "0 auto", width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      }>
        <Routes>
          {/* Upload UI */}
          <Route path="/" element={<UploadPage />} />

          {/* Share link format from worker: /v/:username */}
          <Route path="/v/:username" element={<SharePage />} />

          {/* Universal manual download page */}
          <Route path="/download" element={<DownloadPage />} />

          {/* Backward compat for old /d/... links - can redirect to home or universal download */}
          <Route path="/d/*" element={<Navigate to="/" replace />} />

          {/* Catch-all */}
          <Route path="*" element={
            <div className="app-container" style={{ textAlign: "center", paddingTop: "100px" }}>
              <h1 className="page-title">404</h1>
              <p className="page-subtitle">Page not found.</p>
            </div>
          } />
        </Routes>
      </Suspense>
    </>
  );
}
