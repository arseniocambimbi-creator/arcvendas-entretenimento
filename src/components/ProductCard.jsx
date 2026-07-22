import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function ProductCard({ product }) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('AOA', 'Kz');
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img src={product.imagem} alt={product.name} className="product-image" loading="lazy" />
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
      </div>
      <div className="product-content">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description.substring(0, 80)}...</p>
        
        <div className="product-price-container">
          <span className="price-promo">{formatCurrency(product.preco_promocional)}</span>
          <span className="price-original">{formatCurrency(product.preco_original)}</span>
        </div>
        
        <Link to={`/produto/${product.slug}`} className="btn-primary w-full mt-4">
          <ShoppingCart size={18} />
          Comprar agora
        </Link>
      </div>
    </div>
  );
}
