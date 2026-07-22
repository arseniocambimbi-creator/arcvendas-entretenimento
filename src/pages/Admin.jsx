import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Loader2, Save, Plus, Link2, Copy, LogOut, RefreshCw, Trash2, ChevronDown, ChevronUp, PackageOpen, Eye, EyeOff, Bell, BellOff, TrendingUp } from 'lucide-react';
import { admin } from '../lib/store';

const TOKEN_KEY = 'giftao_admin_token';
const fmt = (v) => new Intl.NumberFormat('pt-AO').format(v) + ' Kz';

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async (tk) => {
    setLoading(true); setError('');
    try {
      const res = await admin('overview', {}, tk);
      setData(res); setAuthed(true);
      sessionStorage.setItem(TOKEN_KEY, tk);
      // Inicializa a contagem de pedidos para o polling
      if (lastOrderCount === null) setLastOrderCount(res.orders?.length ?? 0);
    } catch (e) {
      setError(e.message === 'UNAUTHORIZED' ? 'Palavra-passe incorreta.' : 'Erro ao carregar. Tenta de novo.');
      setAuthed(false);
    } finally { setLoading(false); }
  }, [lastOrderCount]);

  useEffect(() => { if (token) load(token); }, []); // eslint-disable-line

  // Polling de notificações a cada 60 segundos
  useEffect(() => {
    if (!authed || !notifEnabled) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const res = await admin('overview', {}, token);
        const newCount = res.orders?.length ?? 0;
        if (lastOrderCount !== null && newCount > lastOrderCount) {
          const diff = newCount - lastOrderCount;
          const newest = res.orders?.[0];
          if (Notification.permission === 'granted') {
            new Notification('🛒 Nova compra na ArcVendas!', {
              body: newest
                ? `${newest.customer_name} comprou ${newest.product_name} — ${fmt(newest.amount)}`
                : `${diff} novo${diff > 1 ? 's' : ''} pedido${diff > 1 ? 's' : ''} recebido${diff > 1 ? 's' : ''}!`,
              icon: '/icon.svg',
            });
          }
          setData(res);
          setLastOrderCount(newCount);
        } else if (newCount !== lastOrderCount) {
          setLastOrderCount(newCount);
        }
      } catch { /* silencioso */ }
    }, 60000);
    return () => clearInterval(pollRef.current);
  }, [authed, notifEnabled, token, lastOrderCount]);

  const toggleNotifications = async () => {
    if (notifEnabled) { setNotifEnabled(false); return; }
    if (!('Notification' in window)) { alert('O teu browser não suporta notificações.'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifEnabled(true);
      new Notification('✅ Notificações ativas!', { body: 'Vais receber alertas de novas compras na ArcVendas.', icon: '/icon.svg' });
    } else {
      alert('Permissão de notificação negada. Activa nas definições do browser.');
    }
  };

  const logout = () => { clearInterval(pollRef.current); sessionStorage.removeItem(TOKEN_KEY); setToken(''); setAuthed(false); setData(null); setNotifEnabled(false); };

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, margin: '3rem auto' }}>
        <div className="checkout-form">
          <h2 className="text-2xl font-bold mb-6 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={22} /> Painel Admin
          </h2>
          {error && <div className="mb-4" style={errBox}>{error}</div>}
          <form onSubmit={(e) => { e.preventDefault(); load(token); }}>
            <div className="form-group">
              <label className="form-label">Palavra-passe</label>
              <input type="password" className="input-field" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            <button type="submit" className="btn-primary w-full text-lg" style={{ padding: '0.85rem' }} disabled={loading || !token}>
              {loading ? <><Loader2 size={20} className="animate-spin" /> A entrar…</> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h1 className="text-3xl font-bold text-gradient">Painel Admin</h1>
        <div className="flex gap-2">
          <button
            className={notifEnabled ? 'btn-primary' : 'btn-ghost'}
            onClick={toggleNotifications}
            title={notifEnabled ? 'Desativar notificações' : 'Ativar notificações de compra'}
            style={{ padding: '.5rem .9rem' }}
          >
            {notifEnabled ? <><Bell size={16} /> Notificações ON</> : <><BellOff size={16} /> Ativar Notificações</>}
          </button>
          <button className="btn-ghost" onClick={() => load(token)}><RefreshCw size={16} /> Atualizar</button>
          <button className="btn-ghost" onClick={logout}><LogOut size={16} /> Sair</button>
        </div>
      </div>

      {/* Painel de estatísticas */}
      <StatsPanel data={data} />

      <BannerSection settings={data.settings} token={token} onSaved={() => load(token)} />

      <h2 className="text-2xl font-bold mb-4" style={{ marginTop: '2.5rem' }}>Produtos e Stock</h2>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {data.products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            counts={data.stock_counts[p.id] || { available: 0, sold: 0 }}
            token={token}
            onSaved={() => load(token)}
          />
        ))}
      </div>

      <OrdersSection orders={data.orders} />
    </div>
  );
}

// ============ PAINEL DE ESTATÍSTICAS ============
function StatsPanel({ data }) {
  const products = data?.products || [];
  const orders = data?.orders || [];
  const stockCounts = data?.stock_counts || {};

  const totalVendidos = Object.values(stockCounts).reduce((s, c) => s + (c.sold || 0), 0);
  const totalDisponiveis = Object.values(stockCounts).reduce((s, c) => s + (c.available || 0), 0);
  const totalReceita = orders
    .filter(o => ['paid', 'delivered', 'delivering'].includes(o.status))
    .reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const maxVal = Math.max(...products.map(p => {
    const c = stockCounts[p.id] || {};
    return (c.available || 0) + (c.sold || 0);
  }), 1);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('pt-PT', { weekday: 'short' });
    const count = orders.filter(o => (o.created_at || '').slice(0, 10) === key).length;
    return { label, count };
  });
  const maxDay = Math.max(...last7.map(d => d.count), 1);

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="Receita total" value={new Intl.NumberFormat('pt-AO').format(totalReceita) + ' Kz'} color="#22c55e" emoji="💰" />
        <KpiCard label="Pedidos" value={orders.length} color="var(--accent-color)" emoji="🛒" />
        <KpiCard label="Itens vendidos" value={totalVendidos} color="#f59e0b" emoji="📦" />
        <KpiCard label="Em stock" value={totalDisponiveis} color="var(--accent-light)" emoji="✅" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Gráfico: stock vs vendas por produto */}
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} style={{ color: 'var(--accent-color)' }} />
            <span className="font-semibold text-sm">Stock vs Vendas por produto</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {products.map(p => {
              const c = stockCounts[p.id] || {};
              const avail = c.available || 0;
              const sold = c.sold || 0;
              const total = avail + sold;
              const shortName = (p.name || '').split('—')[0].split('|')[0].trim().slice(0, 20);
              return (
                <div key={p.id}>
                  <div className="flex justify-between" style={{ fontSize: '.74rem', marginBottom: '3px' }}>
                    <span className="text-secondary">{shortName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{avail} disp. · {sold} vend.</span>
                  </div>
                  <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-color-secondary)' }}>
                    {sold > 0 && (
                      <div style={{ width: `${(sold / Math.max(total, maxVal)) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)', transition: 'width 0.6s ease' }} />
                    )}
                    {avail > 0 && (
                      <div style={{ width: `${(avail / Math.max(total, maxVal)) * 100}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)', transition: 'width 0.6s ease' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3" style={{ fontSize: '.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b', display: 'inline-block' }} /> Vendido
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} /> Disponível
            </span>
          </div>
        </div>

        {/* Gráfico: pedidos últimos 7 dias */}
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} style={{ color: '#22c55e' }} />
            <span className="font-semibold text-sm">Pedidos — últimos 7 dias</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
            {last7.map(({ label, count }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '.65rem', color: 'var(--text-muted)', minHeight: '12px' }}>{count > 0 ? count : ''}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max((count / maxDay) * 56, count > 0 ? 6 : 2)}px`,
                    borderRadius: '4px 4px 0 0',
                    background: count > 0 ? 'linear-gradient(180deg, var(--accent-color), var(--accent-2))' : 'var(--bg-color-secondary)',
                    transition: 'height 0.5s ease',
                  }}
                />
                <span style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
          {orders.length === 0 && (
            <p className="text-secondary text-sm text-center" style={{ marginTop: '0.5rem' }}>Sem pedidos ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, emoji }) {
  return (
    <div className="glass p-4 rounded-lg" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{emoji}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div className="text-secondary text-sm" style={{ marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

function BannerSection({ settings, token, onSaved }) {
  const [f, setF] = useState({
    hero_title: settings?.hero_title || '',
    hero_subtitle: settings?.hero_subtitle || '',
    hero_image: settings?.hero_image || '',
    banner_ativo: settings?.banner_ativo !== false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await admin('update_settings', { fields: f }, token);
      setMsg('Banner guardado ✓'); onSaved();
    } catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };

  return (
    <div className="glass p-4 rounded-lg">
      <div className="flex justify-between items-center" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <h2 className="text-xl font-bold">⚙️ Banner / Início</h2>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {open && (
        <div style={{ marginTop: '1rem' }}>
          {f.hero_image && <img src={f.hero_image} alt="" className="hero-banner-img" style={{ maxHeight: 160, marginBottom: '1rem' }} />}
          <div className="form-group">
            <label className="form-label">Título</label>
            <input className="input-field" value={f.hero_title} onChange={(e) => setF({ ...f, hero_title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Subtítulo</label>
            <input className="input-field" value={f.hero_subtitle} onChange={(e) => setF({ ...f, hero_subtitle: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Imagem do banner (URL)</label>
            <input className="input-field" value={f.hero_image} onChange={(e) => setF({ ...f, hero_image: e.target.value })} placeholder="https://…" />
          </div>
          <label className="flex items-center gap-2 mb-4" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={f.banner_ativo} onChange={(e) => setF({ ...f, banner_ativo: e.target.checked })} />
            <span className="text-secondary">Mostrar banner na loja</span>
          </label>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar banner
            </button>
            {msg && <span className="text-sm text-secondary">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, counts, token, onSaved }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('info'); // 'info' | 'stock'
  const [f, setF] = useState({
    name: product.name || '',
    description: product.description || '',
    imagem: product.imagem || '',
    badge: product.badge || '',
    preco_promocional: product.preco_promocional,
    preco_original: product.preco_original,
    disponibilidade: product.disponibilidade !== false,
    ativo: product.ativo !== false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [creds, setCreds] = useState('');
  const [link, setLink] = useState('');
  const pageUrl = `${window.location.origin}/produto/${product.slug}`;

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await admin('update_product', {
        id: product.id,
        fields: {
          name: f.name,
          description: f.description,
          imagem: f.imagem,
          badge: f.badge,
          preco_promocional: Number(f.preco_promocional),
          preco_original: Number(f.preco_original),
          disponibilidade: f.disponibilidade,
          ativo: f.ativo,
        }
      }, token);
      setMsg('Guardado ✓'); onSaved();
    } catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };

  const addStock = async () => {
    const linhas = creds.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!linhas.length) return;
    setSaving(true); setMsg('');
    try {
      const r = await admin('add_stock', { product_id: product.id, credentials: linhas }, token);
      setMsg(`+${r.added} adicionado ao stock ✓`);
      setCreds('');
      onSaved();
    } catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };

  const gerarLink = async () => {
    setMsg('');
    try { const r = await admin('checkout_link', { id: product.id }, token); setLink(r.checkout_url || ''); }
    catch (e) { setMsg('Erro ao gerar link: ' + e.message); }
  };

  return (
    <div className="glass rounded-lg" style={{ overflow: 'hidden' }}>
      {/* Cabeçalho clicável */}
      <div
        className="flex justify-between items-center"
        style={{ padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: open ? '1px solid var(--border-color)' : 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <strong style={{ fontSize: '1rem' }}>{product.name}</strong>
          <span className="text-sm text-secondary" style={{ marginLeft: '0.75rem' }}>{fmt(product.preco_promocional)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: counts.available > 0 ? '#22c55e' : '#f87171' }}>
            📦 {counts.available} em stock · {counts.sold} vendido{counts.sold !== 1 ? 's' : ''}
          </span>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {open && (
        <div style={{ padding: '1.25rem' }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              className={tab === 'info' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '.4rem .9rem', fontSize: '.85rem' }}
              onClick={() => setTab('info')}
            >
              ✏️ Editar Produto
            </button>
            <button
              className={tab === 'stock' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '.4rem .9rem', fontSize: '.85rem' }}
              onClick={() => setTab('stock')}
            >
              <PackageOpen size={14} /> Gerir Stock
            </button>
          </div>

          {msg && (
            <div className="mb-3 text-sm" style={{ color: msg.startsWith('Erro') ? '#f87171' : '#22c55e' }}>{msg}</div>
          )}

          {/* TAB: Editar Produto */}
          {tab === 'info' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Field label="Nome do produto" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
                <Field label="Badge / etiqueta (ex: 🔥 Oferta)" value={f.badge} onChange={(v) => setF({ ...f, badge: v })} />
                <Field label="Preço promocional (Kz)" type="number" value={f.preco_promocional} onChange={(v) => setF({ ...f, preco_promocional: v })} />
                <Field label="Preço original (Kz)" type="number" value={f.preco_original} onChange={(v) => setF({ ...f, preco_original: v })} />
                <Field label="Imagem (URL — vazio usa logo automático)" value={f.imagem} onChange={(v) => setF({ ...f, imagem: v })} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '.8rem' }}>Descrição</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="flex gap-4 mb-3" style={{ flexWrap: 'wrap' }}>
                <label className="flex items-center gap-2 text-sm text-secondary" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={f.disponibilidade} onChange={(e) => setF({ ...f, disponibilidade: e.target.checked })} /> Disponível para compra
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Visível na loja
                </label>
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={save} disabled={saving} style={{ padding: '.5rem 1.1rem' }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar alterações
                </button>
                <button className="btn-ghost" onClick={gerarLink} style={{ padding: '.5rem 1rem' }}>
                  <Link2 size={15} /> Gerar link de checkout
                </button>
              </div>
              <div className="mt-3">
                <LinkRow label="Link público do produto" url={pageUrl} />
                {link && <LinkRow label="Link de checkout do gateway" url={link} />}
              </div>
            </div>
          )}

          {tab === 'stock' && (
            <div>
              {/* Resumo do stock */}
              <div className="glass p-3 rounded-lg mb-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <label className="form-label" style={{ color: 'var(--accent-color)' }}>📋 Resumo do Stock</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{counts.available}</span>
                    <span className="text-secondary text-sm" style={{ marginLeft: '0.4rem' }}>disponíve{counts.available !== 1 ? 'is' : 'l'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{counts.sold}</span>
                    <span className="text-secondary text-sm" style={{ marginLeft: '0.4rem' }}>vendido{counts.sold !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Adicionar stock */}
              <div className="glass p-3 rounded-lg mb-4" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <label className="form-label" style={{ color: '#22c55e' }}>➕ Adicionar stock novo</label>
                <p className="text-secondary text-sm mb-2">Uma credencial por linha. Cada linha = 1 item entregue ao cliente após pagamento.</p>
                <textarea
                  className="input-field"
                  rows={4}
                  value={creds}
                  onChange={(e) => setCreds(e.target.value)}
                  placeholder={"email:conta@exemplo.com|senha:1234\nemail:outra@exemplo.com|senha:5678"}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '.85rem' }}
                />
                <button
                  className="btn-primary mt-2"
                  onClick={addStock}
                  disabled={saving || !creds.trim()}
                  style={{ padding: '.5rem 1.1rem' }}
                >
                  <Plus size={15} /> Adicionar ao stock
                </button>
              </div>

              <div className="glass p-3 rounded-lg" style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-secondary text-sm">
                  ⚠️ Para remover credenciais do stock, acede ao <strong>painel do Supabase</strong> → tabela <code>stock</code> e elimina os registos manualmente.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function OrdersSection({ orders }) {
  if (!orders?.length) return null;
  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h2 className="text-2xl font-bold mb-4">Pedidos recentes</h2>
      <div className="glass p-4 rounded-lg" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '.85rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={th}>Data</th><th style={th}>Produto</th><th style={th}>Cliente</th>
              <th style={th}>Valor</th><th style={th}>Método</th><th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={td}>{new Date(o.created_at).toLocaleDateString('pt-PT')}</td>
                <td style={td}>{o.product_name}</td>
                <td style={td}>
                  {o.customer_name}<br />
                  <span className="text-secondary" style={{ fontSize: '.75rem' }}>{o.customer_email}</span>
                </td>
                <td style={td}>{fmt(o.amount)}</td>
                <td style={td}>{o.payment_method}</td>
                <td style={td}><EstadoBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EstadoBadge({ status }) {
  const cores = { delivered: '#22c55e', paid: '#f59e0b', pending: '#94a3b8', failed: '#f87171', delivering: '#7fc3ef' };
  const rotulos = { delivered: 'entregue', paid: 'pago', pending: 'pendente', failed: 'falhou', delivering: 'a entregar' };
  return <span style={{ color: cores[status] || '#94a3b8', fontWeight: 600 }}>{rotulos[status] || status}</span>;
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="form-label" style={{ fontSize: '.8rem' }}>{label}</label>
      <input className="input-field" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function LinkRow({ label, url }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  return (
    <div className="mb-2">
      <label className="form-label" style={{ fontSize: '.8rem' }}>{label}</label>
      <div className="flex gap-2 items-center">
        <input className="input-field" value={url} readOnly onFocus={(e) => e.target.select()} style={{ fontSize: '.8rem' }} />
        <button className="btn-ghost" onClick={copy} style={{ padding: '.5rem .7rem', whiteSpace: 'nowrap' }}>
          <Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

const errBox = { background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', padding: '.75rem 1rem', borderRadius: '.5rem', fontSize: '.9rem' };
const th = { padding: '.5rem .5rem', fontWeight: 600 };
const td = { padding: '.5rem .5rem', verticalAlign: 'top' };
