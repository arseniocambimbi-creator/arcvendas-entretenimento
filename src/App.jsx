import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Admin from './pages/Admin';
import './App.css';

// Vídeo de fundo (otimizado ~730KB) alojado no Supabase Storage (CDN).
const BG_VIDEO = 'https://trdeibvrqqcbvvxbfrbp.supabase.co/storage/v1/object/public/assets/banner2-opt.mp4';

// Só carrega o vídeo quando não prejudica o utilizador (movimento/dados/rede lenta).
function deveMostrarVideo() {
  if (typeof window === 'undefined') return false;
  const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const c = navigator.connection || {};
  const lenta = /(^|-)2g$/.test(c.effectiveType || '');
  return !reduz && !c.saveData && !lenta;
}

// Scroll to top on route change (respeita âncoras #secção)
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function App() {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => { setShowVideo(deveMostrarVideo()); }, []);

  return (
    <div className="app-container">
      {/* Fundo global: vídeo leve quando adequado, senão fica o fundo escuro/gradiente. */}
      <div className="video-bg-wrapper">
        {showVideo && (
          <video src={BG_VIDEO} autoPlay loop muted playsInline preload="auto" className="video-bg" />
        )}
        <div className="video-bg-overlay" />
      </div>

      <ScrollToTop />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produto/:slug" element={<ProductDetails />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
