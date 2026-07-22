import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { whatsappLink } from '../data/site';

export default function Header() {
  return (
    <header className="header glass">
      <div className="container header-content">
        <Link to="/" className="logo">
          <Gift className="logo-icon" size={28} />
          <span>Gift <span className="text-gradient">AO</span></span>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link to="/" className="font-semibold hover:text-accent-color" style={{transition: 'color 0.2s'}}>Catálogo</Link>
          <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer" className="btn-primary">Suporte</a>
        </nav>
      </div>
    </header>
  );
}
