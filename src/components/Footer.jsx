import React from 'react';
import { Shield, Zap, MessageCircle } from 'lucide-react';
import { site, whatsappLink } from '../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3 className="footer-title">{site.nome}</h3>
          <p className="footer-text">A sua loja digital de confiança em Angola.</p>
          <p className="footer-text">Processado por <strong>{site.processadoPor}</strong>.</p>
        </div>
        <div>
          <h3 className="footer-title">Porquê Escolher-nos?</h3>
          <ul className="flex-col gap-2">
            <li className="flex items-center gap-2 text-secondary text-sm"><Zap size={16} className="text-accent-color"/> Entrega Rápida</li>
            <li className="flex items-center gap-2 text-secondary text-sm"><Shield size={16} className="text-accent-color"/> Compra 100% Segura</li>
            <li className="flex items-center gap-2 text-secondary text-sm"><MessageCircle size={16} className="text-accent-color"/> Suporte Dedicado</li>
          </ul>
        </div>
        <div>
          <h3 className="footer-title">Contacto</h3>
          <p className="footer-text">
            <a href={whatsappLink('Olá! Preciso de ajuda com a Gift AO.')} target="_blank" rel="noopener noreferrer" className="hover:text-accent-color">WhatsApp de suporte</a>
          </p>
          <p className="footer-text">{site.email}</p>
          <p className="footer-text text-sm mt-2">© {new Date().getFullYear()} {site.nome}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
