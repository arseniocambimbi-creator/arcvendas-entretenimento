import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Video, Search, MessageCircle, Menu, X } from 'lucide-react';
import { whatsappLink } from '../data/site';

const NAV = [
  { label: 'Início', to: '/' },
  { label: 'Categorias', to: '/#categorias' },
  { label: 'Ofertas', to: '/#ofertas' },
  { label: 'Como funciona', to: '/#como-funciona' },
];

export default function Header() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('busca') || '');
  const [open, setOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?busca=${encodeURIComponent(q.trim())}#catalogo` : '/#catalogo');
    setOpen(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-top">
          <Link to="/" className="logo" onClick={() => setOpen(false)}>
            <span className="logo-badge"><Video size={20} /></span>
            <span>
              Gift <span className="text-gradient">AO</span>
              <span className="logo-sub">by ArcVendas</span>
            </span>
          </Link>

          <form className="search" onSubmit={submitSearch} role="search">
            <Search size={18} className="search-icon" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar produtos, gift cards ou recargas..."
              aria-label="Pesquisar produtos"
            />
          </form>

          <div className="header-actions">
            <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.6rem 1rem' }}>
              <MessageCircle size={17} /> <span className="hide-sm">Suporte</span>
            </a>
            <button className="icon-btn hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="header-nav">
          {NAV.map(n => (
            <Link key={n.label} to={n.to} className="nav-link">{n.label}</Link>
          ))}
          <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer" className="nav-link">Suporte</a>
        </nav>

        {open && (
          <div className="mobile-menu">
            <nav>
              {NAV.map(n => (
                <Link key={n.label} to={n.to} className="nav-link" onClick={() => setOpen(false)}>{n.label}</Link>
              ))}
              <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer" className="nav-link" onClick={() => setOpen(false)}>Suporte</a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
