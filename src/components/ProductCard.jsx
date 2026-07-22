import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Clock, MonitorSmartphone, Zap, Package } from 'lucide-react';
import { formatCurrency, discountPercent } from '../lib/format';
import BrandTile from './BrandTile';

export default function ProductCard({ product }) {
  const desconto = discountPercent(product.preco_original, product.preco_promocional);
  const estoque = product.estoque ?? 0;
  const emEstoque = estoque > 0;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        {product.imagem
          ? <img src={product.imagem} alt={product.name} className="product-image" loading="lazy" />
          : <BrandTile product={product} />}
        {product.badge && <span className="product-badge">{product.badge}</span>}
        {desconto > 0 && <span className="discount-badge">-{desconto}%</span>}
        {product.category && <span className="product-cat-tag">{product.category}</span>}
      </div>

      <div className="product-content">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="product-meta">
          <span className="meta-pill meta-recarga"><Zap size={13} /> Recarga digital</span>
          {product.duracao && <span className="meta-pill"><Clock size={13} /> {product.duracao}</span>}
          {product.dispositivos && <span className="meta-pill"><MonitorSmartphone size={13} /> {product.dispositivos}</span>}
        </div>

        {/* Indicador de estoque */}
        <div className="stock-indicator" style={{ marginBottom: '0.75rem' }}>
          <Package size={14} />
          {emEstoque ? (
            <span className="stock-available">Em stock · {estoque} disponíve{estoque === 1 ? 'l' : 'is'}</span>
          ) : (
            <span className="stock-out">Esgotado</span>
          )}
        </div>

        <div className="product-price-container">
          <span className="price-promo">{formatCurrency(product.preco_promocional)}</span>
          {desconto > 0 && <span className="price-original">{formatCurrency(product.preco_original)}</span>}
        </div>

        {emEstoque ? (
          <Link to={`/produto/${product.slug}`} className="btn-primary w-full">
            <ShoppingCart size={17} /> Comprar agora
          </Link>
        ) : (
          <button className="btn-primary w-full" disabled>
            Esgotado
          </button>
        )}
      </div>
    </div>
  );
}
