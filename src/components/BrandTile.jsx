import React from 'react';
import { brandOf } from '../data/brands';

// Preenche a área de imagem com a identidade do serviço:
// logo oficial sobre a cor da marca, ou o nome estilizado (fallback).
export default function BrandTile({ product }) {
  const b = brandOf(product);
  return (
    <div className="brand-tile" style={{ background: b.bg }}>
      {b.glyph
        ? <img src={b.glyph} alt={b.name} className="brand-glyph" style={{ width: b.glyphSize || '42%' }} loading="lazy" />
        : <span className="brand-name">{b.name}</span>}
    </div>
  );
}
