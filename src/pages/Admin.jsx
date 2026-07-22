import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Loader2, Save, Plus, Link2, Copy, LogOut, RefreshCw, Trash2, ChevronDown, ChevronUp, PackageOpen, Eye, EyeOff } from 'lucide-react';
import { admin } from '../lib/store';

const TOKEN_KEY = 'giftao_admin_token';
const fmt = (v) => new Intl.NumberFormat('pt-AO').format(v) + ' Kz';

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (tk) => {
    setLoading(true); setError('');
    try {
      const res = await admin('overview', {}, tk);
      setData(res); setAuthed(true);
      sessionStorage.setItem(TOKEN_KEY, tk);
    } catch (e) {
      setError(e.message === 'UNAUTHORIZED' ? 'Palavra-passe incorreta.' : 'Erro ao carregar. Tenta de novo.');
      setAuthed(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) load(token); }, []); // eslint-disable-line

  const logout = () => { sessionStorage.removeItem(TOKEN_KEY); setToken(''); setAuthed(false); setData(null); };

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
          <button className="btn-ghost" onClick={() => load(token)}><RefreshCw size={16} /> Atualizar</button>
          <button className="btn-ghost" onClick={logout}><LogOut size={16} /> Sair</button>
        </div>
      </div>

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
  const [stockItems, setStockItems] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);
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
      loadStockItems();
    } catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };

  const loadStockItems = async () => {
    setLoadingStock(true);
    try {
      const r = await admin('list_stock', { product_id: product.id }, token);
      setStockItems(r.items || []);
    } catch {
      setStockItems([]);
    } finally { setLoadingStock(false); }
  };

  const deleteStockItem = async (itemId) => {
    if (!window.confirm('Remover este item do stock?')) return;
    setSaving(true); setMsg('');
    try {
      await admin('delete_stock', { item_id: itemId }, token);
      setMsg('Item removido ✓');
      onSaved();
      loadStockItems();
    } catch (e) { setMsg('Erro ao remover: ' + e.message); } finally { setSaving(false); }
  };

  const clearAllStock = async () => {
    if (!window.confirm(`Tens a certeza que queres apagar TODO o stock de "${product.name}"?`)) return;
    setSaving(true); setMsg('');
    try {
      await admin('clear_stock', { product_id: product.id }, token);
      setMsg('Todo o stock foi removido ✓');
      onSaved();
      loadStockItems();
    } catch (e) { setMsg('Erro ao limpar stock: ' + e.message); } finally { setSaving(false); }
  };

  const gerarLink = async () => {
    setMsg('');
    try { const r = await admin('checkout_link', { id: product.id }, token); setLink(r.checkout_url || ''); }
    catch (e) { setMsg('Erro ao gerar link: ' + e.message); }
  };

  const handleTabStock = () => {
    setTab('stock');
    if (stockItems === null) loadStockItems();
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
              onClick={handleTabStock}
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

          {/* TAB: Gerir Stock */}
          {tab === 'stock' && (
            <div>
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

              {/* Lista de stock atual */}
              <div>
                <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    📋 Stock atual — {counts.available} disponíve{counts.available !== 1 ? 'is' : 'l'} · {counts.sold} vendido{counts.sold !== 1 ? 's' : ''}
                  </label>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={loadStockItems} style={{ padding: '.3rem .7rem', fontSize: '.78rem' }}>
                      <RefreshCw size={13} /> Recarregar
                    </button>
                    {counts.available > 0 && (
                      <button
                        className="btn-ghost"
                        onClick={clearAllStock}
                        disabled={saving}
                        style={{ padding: '.3rem .7rem', fontSize: '.78rem', color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}
                      >
                        <Trash2 size={13} /> Limpar tudo
                      </button>
                    )}
                  </div>
                </div>

                {loadingStock ? (
                  <div className="text-center" style={{ padding: '1.5rem' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-color)' }} />
                  </div>
                ) : stockItems === null ? (
                  <div className="text-center text-secondary text-sm" style={{ padding: '1rem' }}>
                    A carregar itens de stock…
                  </div>
                ) : stockItems.length === 0 ? (
                  <div className="glass text-center text-secondary text-sm" style={{ padding: '1.5rem', borderRadius: 'var(--radius)' }}>
                    Nenhum item em stock. Adiciona credenciais acima.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {stockItems.map((item) => (
                      <StockItem key={item.id} item={item} onDelete={() => deleteStockItem(item.id)} disabled={saving} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StockItem({ item, onDelete, disabled }) {
  const [visible, setVisible] = useState(false);
  const isSold = item.status === 'sold';
  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: 'var(--bg-color-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        padding: '.55rem .85rem',
        fontSize: '.82rem',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isSold ? 'var(--text-muted)' : 'var(--text-primary)',
          filter: visible ? 'none' : 'blur(5px)',
          transition: 'filter 0.2s',
          userSelect: visible ? 'auto' : 'none',
        }}
      >
        {item.credential_data || item.credential || '—'}
      </span>
      <span
        style={{
          fontSize: '.72rem',
          padding: '.2rem .5rem',
          borderRadius: '6px',
          fontWeight: 600,
          flexShrink: 0,
          background: isSold ? 'rgba(248,113,113,.15)' : 'rgba(34,197,94,.15)',
          color: isSold ? '#f87171' : '#22c55e',
        }}
      >
        {isSold ? 'Vendido' : 'Disponível'}
      </span>
      <button
        onClick={() => setVisible(v => !v)}
        title={visible ? 'Ocultar' : 'Mostrar'}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, padding: '2px' }}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      {!isSold && (
        <button
          onClick={onDelete}
          disabled={disabled}
          title="Remover este item"
          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', flexShrink: 0, padding: '2px' }}
        >
          <Trash2 size={15} />
        </button>
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
