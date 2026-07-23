import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, X, Search as SearchIcon, Flame, MapPin, CreditCard, ShieldCheck, MessageCircle, Play, Music, Tv } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { products as fallbackProducts } from '../data/products';
import { categories } from '../data/categories';
import { getCatalog } from '../lib/store';
import { discountPercent, normalize } from '../lib/format';
import bannerImage from '../assets/banner3.png';

const DEFAULT_SETTINGS = {
  hero_title: 'Recargas digitais. Simples, rápidas e em Kz.',
  hero_subtitle: 'Netflix, Spotify, YouCine e UniTV ao teu alcance. Escolhe a tua recarga, paga em Kz e recebe o acesso automaticamente.',
  hero_image: null,
  banner_ativo: true,
};

const TRUST = [
  { Icon: Zap, title: 'Atendimento rápido' },
  { Icon: MapPin, title: 'Feito para Angola' },
  { Icon: CreditCard, title: 'Pagamento em Kz' },
  { Icon: ShieldCheck, title: 'Entrega automática' },
  { Icon: MessageCircle, title: 'Suporte ArcVendas' },
];

const STEPS = [
  { n: '1', title: 'Escolhe a tua recarga', desc: 'Navega pelo catálogo e seleciona o serviço que queres.' },
  { n: '2', title: 'Faz o teu pedido', desc: 'Preenche os dados e escolhe o método de pagamento em Kz.' },
  { n: '3', title: 'Recebe a tua recarga', desc: 'Após a confirmação, recebes o acesso automaticamente por e-mail.' },
];

const HERO_CARDS = [
  { Icon: Play, color: '#e50914', name: 'Netflix', sub: 'Filmes e séries' },
  { Icon: Music, color: '#1DB954', name: 'Spotify', sub: 'Música premium' },
  { Icon: Tv, color: '#2b8fd6', name: 'UniTV', sub: 'TV e canais' },
];

export default function Home() {
  const [products, setProducts] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [params, setParams] = useSearchParams();

  const busca = params.get('busca') || '';
  const activeCat = params.get('cat') || '';

  useEffect(() => {
    let alive = true;
    getCatalog()
      .then(({ products, settings }) => {
        if (!alive) return;
        setProducts(products && products.length ? products : fallbackProducts);
        if (settings && settings.hero_title) setSettings(settings);
      })
      .catch(() => { if (alive) setProducts(fallbackProducts); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (busca || activeCat) {
      const el = document.getElementById('catalogo');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [busca, activeCat]);

  const list = useMemo(() => products ?? [], [products]);

  const filtered = useMemo(() => {
    let r = list;
    const catObj = categories.find(c => c.id === activeCat);
    if (catObj?.especial === 'ofertas') r = r.filter(p => discountPercent(p.preco_original, p.preco_promocional) > 0);
    else if (catObj?.slug) r = r.filter(p => normalize(p.category) === normalize(catObj.slug));
    if (busca) {
      const q = normalize(busca);
      r = r.filter(p => normalize(`${p.name} ${p.description} ${p.category}`).includes(q));
    }
    return r;
  }, [list, activeCat, busca]);

  const ofertas = useMemo(
    () => list
      .filter(p => discountPercent(p.preco_original, p.preco_promocional) > 0)
      .sort((a, b) => discountPercent(b.preco_original, b.preco_promocional) - discountPercent(a.preco_original, a.preco_promocional)),
    [list],
  );

  const setCat = (id) => setParams(id ? { cat: id } : {});
  const clearFilters = () => setParams({});

  const activeCatObj = categories.find(c => c.id === activeCat);
  const catalogTitle = busca
    ? `Resultados para "${busca}"`
    : activeCatObj ? activeCatObj.nome : 'Recargas em destaque';

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      {settings.banner_ativo !== false && (
        <section className="hero" style={{ paddingBottom: '1rem' }}>
          <div className="container">
            <div style={{ textAlign: 'center' }}>
              <img src={bannerImage} alt="Banner Principal" style={{ width: '100%', borderRadius: 'var(--radius-lg)', display: 'block', marginBottom: '1.5rem' }} />
              <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                <a href="#catalogo" className="btn-primary text-lg">Explorar recargas <ArrowRight size={18} /></a>
                <a href="#ofertas" className="btn-ghost text-lg">Ver ofertas</a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIAS */}
      <section id="categorias" className="section-tight">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Categorias</h2>
            <p className="section-sub">Navega por tipo de recarga digital.</p>
          </div>
          <div className="cat-grid">
            {categories.map(c => (
              <button key={c.id} className={`cat-card ${activeCat === c.id ? 'active' : ''}`} onClick={() => setCat(activeCat === c.id ? '' : c.id)}>
                {c.brevemente && <span className="cat-soon">EM BREVE</span>}
                <span className="cat-emoji"><c.Icon size={26} /></span>
                <span className="cat-name">{c.nome}</span>
                <span className="cat-desc">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CATÁLOGO / RESULTADOS */}
      <section id="catalogo" className="section">
        <div className="container">
          <div className="section-head flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 className="section-title">{!busca && !activeCat && <Flame size={20} style={{ color: 'var(--accent-color)' }} />}{catalogTitle}</h2>
              <p className="section-sub">{filtered.length} recarga{filtered.length === 1 ? '' : 's'} · entrega automática após o pagamento.</p>
            </div>
            {(busca || activeCat) && (
              <button className="chip active" onClick={clearFilters}><X size={14} /> Limpar filtros</button>
            )}
          </div>

          {products === null ? (
            <div className="text-center text-secondary" style={{ padding: '3rem 0' }}>A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="glass" style={{ padding: '3rem 1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <SearchIcon size={30} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.35rem' }}>
                {activeCatObj?.brevemente ? 'Em breve nesta categoria' : 'Nenhuma recarga encontrada'}
              </p>
              <p className="text-secondary text-sm">
                {activeCatObj?.brevemente ? 'Estamos a preparar novas recargas. Volta em breve!' : 'Tenta outra pesquisa ou limpa os filtros.'}
              </p>
              <button className="btn-ghost mt-4" onClick={clearFilters} style={{ marginTop: '1.25rem' }}>Ver todas as recargas</button>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="section" style={{ background: 'var(--bg-color-secondary)' }}>
        <div className="container">
          <div className="section-head text-center">
            <h2 className="section-title" style={{ justifyContent: 'center' }}>Como funciona</h2>
            <p className="section-sub">Comprar a tua recarga digital nunca foi tão simples.</p>
          </div>
          <div className="steps-grid">
            {STEPS.map(s => (
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIANÇA */}
      <section className="section-tight">
        <div className="container">
          <div className="trust-grid">
            {TRUST.map(t => (
              <div key={t.title} className="trust-item">
                <span className="trust-icon"><t.Icon size={22} /></span>
                <span className="trust-title">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTAS */}
      {ofertas.length > 0 && (
        <section id="ofertas" className="section">
          <div className="container">
            <div className="offers-banner mb-8">
              <div>
                <h3><Flame size={20} style={{ verticalAlign: '-3px', marginRight: 6, color: 'var(--accent-color)' }} />Ofertas por tempo limitado</h3>
                <p>Os melhores descontos em recargas digitais, pagos em Kz.</p>
              </div>
              <a href="#catalogo" className="btn-primary" onClick={() => setCat('ofertas')}><Zap size={17} /> Ver todas</a>
            </div>
            <div className="products-grid">
              {ofertas.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
