import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { site, whatsappLink } from '../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: '0.9rem' }}>
              <span className="logo-badge"><Video size={20} /></span>
              <span>Gift <span className="text-gradient">AO</span></span>
            </div>
            <p className="footer-text">Uma marca da <strong>{site.processadoPor}</strong>.</p>
            <p className="footer-text">Entretenimento digital simples, rápido e acessível.</p>
          </div>

          <div>
            <h3 className="footer-title">Loja</h3>
            <div className="footer-links">
              <Link to="/">Início</Link>
              <a href="/#catalogo">Produtos</a>
              <a href="/#ofertas">Ofertas</a>
              <a href="/#como-funciona">Como funciona</a>
            </div>
          </div>

          <div>
            <h3 className="footer-title">Ajuda</h3>
            <div className="footer-links">
              <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer">Suporte</a>
              <a href={`mailto:${site.email}`}>Contacto</a>
              <a href="/#como-funciona">Perguntas frequentes</a>
            </div>
          </div>

          <div>
            <h3 className="footer-title">Contacto</h3>
            <p className="footer-text">{site.email}</p>
            <p className="footer-text">WhatsApp: +244 951 257 125</p>
            <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ marginTop: '0.6rem', padding: '0.55rem 1rem' }}>Falar connosco</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Gift AO — {site.processadoPor}. Todos os direitos reservados.</span>
          <span>Processamento de pedidos e recargas: {site.processadoPor}</span>
        </div>
      </div>
    </footer>
  );
}
