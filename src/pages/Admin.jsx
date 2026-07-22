import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Loader2, Save, Plus, Link2, Copy, LogOut, RefreshCw } from 'lucide-react';
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
          <h2 className="text-2xl font-bold mb-6 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={22} /> Painel Admin</h2>
          {error && <div className="mb-4" style={errBox}>{error}</div>}
          <form onSubmit={(e) => { e.preventDefault(); load(token); }}>
            <div className="form-group">
              <label className="form-label">Palavra-passe</label>
              <input type="password" className="input-field" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            <button type="submit" className="btn-primary w-full text-lg" style={{ padding: '0.85rem' }} disabled={loading || !token}>{loading ? <><Loader2 size={20} className="animate-spin" /> A entrar…</> : 'Entrar'}</button>
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
        {data.products.map((p) => (<ProductRow key={p.id} product={p} counts={data.stock_counts[p.id] || { available: 0, sold: 0 }} token={token} onSaved={() => load(token)} />))}
      </div>

      <OrdersSection orders={data.orders} />
    </div>
  );
}

function BannerSection({ settings, token, onSaved }) {
  const [f, setF] = useState({
    hero_title: settings?.hero_title || '', hero_subtitle: settings?.hero_subtitle || '',
    hero_image: settings?.hero_image || '', banner_ativo: settings?.banner_ativo !== false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const save = async () => {
    setSaving(true); setMsg('');
    try { await admin('update_settings', { fields: f }, token); setMsg('Banner guardado ✓'); onSaved(); }
    catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };
  return (
    <div className="glass p-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Banner / Início</h2>
      {f.hero_image && <img src={f.hero_image} alt="" className="hero-banner-img" style={{ maxHeight: 160 }} />}
      <div className="form-group"><label className="form-label">Título</label><input className="input-field" value={f.hero_title} onChange={(e) => setF({ ...f, hero_title: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">Subtítulo</label><input className="input-field" value={f.hero_subtitle} onChange={(e) => setF({ ...f, hero_subtitle: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">Imagem do banner (URL)</label><input className="input-field" value={f.hero_image} onChange={(e) => setF({ ...f, hero_image: e.target.value })} placeholder="https://…" /></div>
      <label className="flex items-center gap-2 mb-4" style={{ cursor: 'pointer' }}><input type="checkbox" checked={f.banner_ativo} onChange={(e) => setF({ ...f, banner_ativo: e.target.checked })} /> <span className="text-secondary">Mostrar banner na loja</span></label>
      <div className="flex items-center gap-3"><button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar banner</button>{msg && <span className="text-sm text-secondary">{msg}</span>}</div>
    </div>
  );
}

function ProductRow({ product, counts, token, onSaved }) {
  const [f, setF] = useState({
    imagem: product.imagem || '', badge: product.badge || '',
    preco_promocional: product.preco_promocional, preco_original: product.preco_original,
    disponibilidade: product.disponibilidade !== false, ativo: product.ativo !== false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [creds, setCreds] = useState('');
  const [link, setLink] = useState('');
  const pageUrl = `${window.location.origin}/produto/${product.slug}`;
  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await admin('update_product', { id: product.id, fields: { imagem: f.imagem, badge: f.badge, preco_promocional: Number(f.preco_promocional), preco_original: Number(f.preco_original), disponibilidade: f.disponibilidade, ativo: f.ativo } }, token);
      setMsg('Guardado ✓'); onSaved();
    } catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };
  const addStock = async () => {
    const linhas = creds.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!linhas.length) return;
    setSaving(true); setMsg('');
    try { const r = await admin('add_stock', { product_id: product.id, credentials: linhas }, token); setMsg(`+${r.added} em stock ✓`); setCreds(''); onSaved(); }
    catch (e) { setMsg('Erro: ' + e.message); } finally { setSaving(false); }
  };
  const gerarLink = async () => {
    setMsg('');
    try { const r = await admin('checkout_link', { id: product.id }, token); setLink(r.checkout_url || ''); }
    catch (e) { setMsg('Erro ao gerar link: ' + e.message); }
  };
  return (
    <div className="glass p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3" style={{ flexWrap: 'wrap', gap: 8 }}>
        <strong>{product.name}</strong>
        <span className="text-sm" style={{ color: counts.available > 0 ? '#22c55e' : '#f87171' }}>Stock: {counts.available} disponíve{counts.available === 1 ? 'l' : 'is'} · {counts.sold} vendido{counts.sold === 1 ? '' : 's'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <Field label="Imagem (URL) — vazio usa o logo da marca" value={f.imagem} onChange={(v) => setF({ ...f, imagem: v })} />
        <Field label="Badge / etiqueta" value={f.badge} onChange={(v) => setF({ ...f, badge: v })} />
        <Field label="Preço promo (Kz)" type="number" value={f.preco_promocional} onChange={(v) => setF({ ...f, preco_promocional: v })} />
        <Field label="Preço original (Kz)" type="number" value={f.preco_original} onChange={(v) => setF({ ...f, preco_original: v })} />
      </div>
      <div className="flex gap-4 mt-2 mb-3" style={{ flexWrap: 'wrap' }}>
        <label className="flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={f.disponibilidade} onChange={(e) => setF({ ...f, disponibilidade: e.target.checked })} /> Disponível</label>
        <label className="flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Visível na loja</label>
      </div>
      <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={save} disabled={saving} style={{ padding: '.5rem 1rem' }}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar</button>
        <button className="btn-ghost" onClick={gerarLink} style={{ padding: '.5rem 1rem' }}><Link2 size={15} /> Gerar link de checkout</button>
        {msg && <span className="text-sm text-secondary">{msg}</span>}
      </div>
      <LinkRow label="Link da loja (entrega automática do stock)" url={pageUrl} />
      {link && <LinkRow label="Link de checkout do gateway" url={link} />}
      <div className="mt-3">
        <label className="form-label">Adicionar stock (uma credencial por linha)</label>
        <textarea className="input-field" rows={3} value={creds} onChange={(e) => setCreds(e.target.value)} placeholder={"email: conta@exemplo.com | senha: 1234"} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '.85rem' }} />
        <button className="btn-primary mt-2" onClick={addStock} disabled={saving || !creds.trim()} style={{ padding: '.5rem 1rem' }}><Plus size={15} /> Adicionar ao stock</button>
      </div>
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
          <thead><tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}><th style={th}>Data</th><th style={th}>Produto</th><th style={th}>Cliente</th><th style={th}>Valor</th><th style={th}>Método</th><th style={th}>Estado</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={td}>{new Date(o.created_at).toLocaleDateString('pt-PT')}</td>
                <td style={td}>{o.product_name}</td>
                <td style={td}>{o.customer_name}<br /><span className="text-secondary" style={{ fontSize: '.75rem' }}>{o.customer_email}</span></td>
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
  return (<div><label className="form-label" style={{ fontSize: '.8rem' }}>{label}</label><input className="input-field" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>);
}

function LinkRow({ label, url }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  return (
    <div className="mb-2">
      <label className="form-label" style={{ fontSize: '.8rem' }}>{label}</label>
      <div className="flex gap-2 items-center"><input className="input-field" value={url} readOnly onFocus={(e) => e.target.select()} style={{ fontSize: '.8rem' }} /><button className="btn-ghost" onClick={copy} style={{ padding: '.5rem .7rem', whiteSpace: 'nowrap' }}><Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}</button></div>
    </div>
  );
}

const errBox = { background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', padding: '.75rem 1rem', borderRadius: '.5rem', fontSize: '.9rem' };
const th = { padding: '.5rem .5rem', fontWeight: 600 };
const td = { padding: '.5rem .5rem', verticalAlign: 'top' };
