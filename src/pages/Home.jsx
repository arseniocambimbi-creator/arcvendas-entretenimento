import React, { useEffect, useState } from 'react';
import { Shield, Zap, HeartHandshake, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products as fallbackProducts } from '../data/products';
import { getCatalog } from '../lib/store';

const DEFAULT_SETTINGS = {
  hero_title: 'Os melhores presentes digitais, agora em Angola.',
  hero_subtitle: 'Compra vales-presente, créditos digitais e entretenimento. Escolhe o teu produto, paga em Kz e desfruta da entrega rápida.',
  hero_image: null,
  banner_ativo: true,
};

export default function Home() {
  const [products, setProducts] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let alive = true;
    getCatalog()
      .then(({ products, settings }) => {
        if (!alive) return;
        setProducts(products && products.length ? products : fallbackProducts);
        if (settings) setSettings(settings);
      })
      .catch(() => { if (alive) setProducts(fallbackProducts); });
    return () => { alive = false; };
  }, []);

  const list = products ?? [];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      {settings.banner_ativo !== false && (
        <section className="hero">
          {settings.hero_image && (
            <img src={settings.hero_image} alt="" className="hero-banner-img" />
          )}
          <div className="container">
            <h1 className="hero-title">{renderTitle(settings.hero_title)}</h1>
            <p className="hero-subtitle">{settings.hero_subtitle}</p>
            <div className="flex gap-4 justify-center">
              <a href="#catalogo" className="btn-primary text-lg">Ver Catálogo</a>
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      <section className="container">
        <div className="trust-grid">
          <div className="trust-item glass">
            <Zap size={32} className="trust-icon" />
            <h3 className="trust-title">Atendimento Rápido</h3>
            <p className="trust-desc">Acesso quase imediato após confirmação.</p>
          </div>
          <div className="trust-item glass">
            <Shield size={32} className="trust-icon" />
            <h3 className="trust-title">Pagamento em Kz</h3>
            <p className="trust-desc">Pague facilmente na nossa moeda local.</p>
          </div>
          <div className="trust-item glass">
            <HeartHandshake size={32} className="trust-icon" />
            <h3 className="trust-title">Compra Segura</h3>
            <p className="trust-desc">Transações 100% protegidas e fiáveis.</p>
          </div>
        </div>
      </section>

      {/* Products Catalog */}
      <section id="catalogo" className="container mb-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-gradient">Nosso Catálogo</h2>
        {products === null ? (
          <div className="text-center text-secondary" style={{ padding: '3rem 0' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div className="products-grid">
            {list.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Realça a última "frase" do título com o gradiente (após vírgula ou quebra).
function renderTitle(title) {
  if (!title) return null;
  const idx = title.lastIndexOf(',');
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx + 1)}<br />
      <span className="text-gradient">{title.slice(idx + 1).trim()}</span>
    </>
  );
}
