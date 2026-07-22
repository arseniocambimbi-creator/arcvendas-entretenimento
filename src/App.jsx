import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Admin from './pages/Admin';
import banner2Video from './assets/banner2.mp4';
import './App.css';

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
  return (
    <div className="app-container">
      {/* VÍDEO DE FUNDO — COBRE TODO O SITE */}
      <div className="video-bg-wrapper">
        <video
          src={banner2Video}
          autoPlay
          loop
          muted
          playsInline
          className="video-bg"
        />
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
