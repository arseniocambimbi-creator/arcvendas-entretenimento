import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MonitorSmartphone, ShieldCheck, ArrowLeft, Send, Loader2, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { products as fallbackProducts } from '../data/products';
import { createCheckout, getOrderStatus, getCatalog, PAYMENT_METHODS } from '../lib/store';
import { formatCurrency } from '../lib/format';
import BrandTile from '../components/BrandTile';

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(undefined);

  useEffect(() => {
    let alive = true;
    getCatalog()
      .then(({ products }) => {
        if (!alive) return;
        const list = products && products.length ? products : fallbackProducts;
        setProduct(list.find(p => p.slug === slug) || null);
      })
      .catch(() => { if (alive) setProduct(fallbackProducts.find(p => p.slug === slug) || null); });
    return () => { alive = false; };
  }, [slug]);

  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', pagamento: 'multicaixa' });
  const [phase, setPhase] = useState('form');
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [credential, setCredential] = useState('');
  const pollRef = useRef(null);

  const method = PAYMENT_METHODS.find(m => m.value === formData.pagamento) || PAYMENT_METHODS[0];

  useEffect(() => {
    if (phase !== 'pending' || !order?.order_id) return;
    let stop = false;
    async function tick() {
      try {
        const r = await getOrderStatus(order.order_id);
        if (stop) return;
        if (r.status === 'delivered') { setCredential(r.credential || ''); setPhase('delivered'); }
        else if (r.status === 'failed') { setPhase('failed'); setError('O pagamento foi cancelado ou falhou. Tenta novamente.'); }
      } catch { /* mantém a sondar */ }
    }
    pollRef.current = setInterval(tick, 4000);
    tick();
    return () => { stop = true; clearInterval(pollRef.current); };
  }, [phase, order]);

  if (product === undefined) {
    return (<div className="container text-center mt-12"><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-color)' }} /></div>);
  }

  if (!product) {
    return (
      <div className="container text-center mt-12">
        <h2 className="text-2xl font-bold">Produto não encontrado.</h2>
        <Link to="/" className="btn-primary mt-4">Voltar ao Catálogo</Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setPhase('submitting');
    try {
      const res = await createCheckout({
        product_id: product.id, payment_method: formData.pagamento,
        customer_name: formData.nome, customer_email: formData.email, customer_phone: formData.telefone,
      });
      setOrder(res); setPhase('pending');
    } catch (err) { setError(traduzErro(err.message)); setPhase('form'); }
  };

  const gw = order?.gateway || {};
  const ref = (gw.reference && typeof gw.reference === 'object') ? gw.reference : {};
  const checkoutUrl = gw.checkout_url || gw.url || gw.redirect_url || gw.payment_url || gw.stripe_url || ref.checkout_url;
  const reference = ref.reference_number || ref.reference || (typeof gw.reference === 'string' ? gw.reference : null) || gw.referencia;
  const entity = ref.entity || gw.entity || gw.entidade;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <Link to="/" className="flex items-center gap-2 text-secondary mb-6" style={{ width: 'fit-content' }}>
        <ArrowLeft size={20} /> Voltar
      </Link>

      <div className="details-grid">
        <div>
          {product.imagem
            ? <img src={product.imagem} alt={product.name} className="details-image mb-6" />
            : <div className="details-image mb-6" style={{ position: 'relative', overflow: 'hidden' }}><BrandTile product={product} /></div>}
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex gap-4 items-center mb-6" style={{ flexWrap: 'wrap' }}>
            <span className="price-promo">{formatCurrency(product.preco_promocional)}</span>
            <span className="price-original">{formatCurrency(product.preco_original)}</span>
            {product.badge && <span className="product-badge" style={{ position: 'static' }}>{product.badge}</span>}
          </div>

          <p className="text-secondary mb-6">{product.description}</p>

          <div className="glass p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">Informação Adicional</h3>
            <div className="info-item"><Clock className="info-icon" size={20} /><span><strong>Duração:</strong> {product.duracao}</span></div>
            <div className="info-item"><MonitorSmartphone className="info-icon" size={20} /><span><strong>Dispositivos:</strong> {product.dispositivos}</span></div>
            <div className="info-item"><ShieldCheck className="info-icon" size={20} /><span><strong>Recarga digital</strong> — entrega automática após pagamento confirmado</span></div>
          </div>
        </div>

        <div>
          <div className="checkout-form">
            {phase === 'delivered' ? (
              <DeliveredPanel product={product} credential={credential} channels={order?.delivery_channels} />
            ) : phase === 'pending' ? (
              <PendingPanel method={method} amount={product.preco_promocional} checkoutUrl={checkoutUrl} reference={reference} entity={entity} />
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6 text-gradient">Finalizar Pedido</h2>
                {error && <div className="mb-4" style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', padding: '.75rem 1rem', borderRadius: '.5rem', fontSize: '.9rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="nome">Nome Completo</label>
                    <input type="text" id="nome" name="nome" className="input-field" placeholder="Seu nome" required value={formData.nome} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">E-mail</label>
                    <input type="email" id="email" name="email" className="input-field" placeholder="seu.email@exemplo.com" required value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="telefone">Telefone / WhatsApp {method.needsPhone ? '' : '(opcional)'}</label>
                    <input type="tel" id="telefone" name="telefone" className="input-field" placeholder="9XX XXX XXX" required={method.needsPhone} value={formData.telefone} onChange={handleInputChange} />
                    <p className="text-sm text-secondary" style={{ marginTop: '.4rem' }}>Recebes também os dados de acesso por aqui.</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Produto Selecionado</label>
                    <input type="text" className="input-field" value={`${product.name} - ${formatCurrency(product.preco_promocional)}`} disabled style={{ opacity: 0.7 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pagamento">Método de Pagamento</label>
                    <select id="pagamento" name="pagamento" className="input-field" value={formData.pagamento} onChange={handleInputChange}>
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <p className="text-sm text-secondary mb-4">* Pagamento processado de forma segura. Assim que for confirmado, a tua recarga é entregue automaticamente por e-mail{formData.telefone ? ' e WhatsApp' : ''}.</p>
                    <button type="submit" className="btn-primary w-full text-lg" style={{ padding: '0.85rem' }} disabled={phase === 'submitting'}>
                      {phase === 'submitting' ? <><Loader2 size={20} className="animate-spin" /> Por favor aguarde, o seu pedido está a ser processado...</> : <><Send size={20} /> Pagar {formatCurrency(product.preco_promocional)}</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingPanel({ method, amount, checkoutUrl, reference, entity }) {
  return (
    <div className="text-center">
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-color)', margin: '0 auto 1rem' }} />
      <h2 className="text-2xl font-bold mb-2">Aguardando pagamento</h2>
      <p className="text-secondary mb-6">Confirma o pagamento de <strong>{formatCurrency(amount)}</strong> para receberes a tua recarga automaticamente.</p>
      <div className="glass p-4 rounded-lg mb-4" style={{ textAlign: 'left' }}>
        {method.value === 'multicaixa' && (<p className="text-sm">Vais receber um pedido de confirmação no teu telemóvel na app <strong>Multicaixa Express</strong>. Abre a app e aprova o pagamento.</p>)}
        {method.value === 'reference' && (
          <div className="text-sm">
            <p className="mb-2">Paga por <strong>Referência</strong> num ATM, Multicaixa ou app do teu banco:</p>
            {entity && <div className="info-item"><span><strong>Entidade:</strong> {entity}</span></div>}
            {reference && <div className="info-item"><span><strong>Referência:</strong> {reference}</span></div>}
            <div className="info-item"><span><strong>Montante:</strong> {formatCurrency(amount)}</span></div>
            {!reference && <p className="text-secondary" style={{ marginTop: '.5rem' }}>A referência será enviada para o teu e-mail em instantes.</p>}
          </div>
        )}
        {method.value === 'stripe' && (
          <div className="text-sm">
            <p className="mb-3">Conclui o pagamento com cartão na página segura:</p>
            {checkoutUrl ? <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full"><ExternalLink size={18} /> Pagar com cartão</a> : <p className="text-secondary">A preparar a página de pagamento…</p>}
          </div>
        )}
      </div>
      <p className="text-sm text-secondary">Esta página atualiza-se sozinha assim que o pagamento for confirmado. Podes deixá-la aberta.</p>
    </div>
  );
}

function DeliveredPanel({ product, credential, channels }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(credential).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="text-center">
      <CheckCircle2 size={44} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
      <h2 className="text-2xl font-bold mb-2">Pagamento confirmado!</h2>
      <p className="text-secondary mb-6">A tua recarga de <strong>{product.name}</strong> foi concluída. Aqui estão os teus dados de acesso:</p>
      <div className="glass p-4 rounded-lg mb-4" style={{ textAlign: 'left', position: 'relative' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--accent-color)', fontSize: '.95rem' }}>{credential || '—'}</pre>
        {credential && (<button onClick={copy} className="btn-primary" style={{ position: 'absolute', top: '.5rem', right: '.5rem', padding: '.4rem .7rem', fontSize: '.8rem' }}><Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}</button>)}
      </div>
      <p className="text-sm text-secondary">Enviámos também para o teu e-mail{channels?.includes('whatsapp') ? ' e WhatsApp' : ''}.</p>
      <Link to="/" className="btn-primary mt-4">Voltar ao Catálogo</Link>
    </div>
  );
}

function traduzErro(code) {
  const map = {
    INVALID_PAYMENT_METHOD: 'Método de pagamento inválido.',
    NAME_REQUIRED: 'Indica o teu nome.',
    VALID_EMAIL_REQUIRED: 'Indica um e-mail válido.',
    PHONE_REQUIRED: 'O Multicaixa Express precisa do teu número de telefone.',
    PRODUCT_UNAVAILABLE: 'Este produto não está disponível de momento.',
    GATEWAY_NOT_CONFIGURED: 'O pagamento ainda não está configurado. Contacta o suporte.',
    GATEWAY_UNREACHABLE: 'Não foi possível contactar o sistema de pagamento. Tenta novamente.',
    GATEWAY_ERROR: 'O sistema de pagamento recusou o pedido. Tenta novamente.',
  };
  return map[code] || 'Ocorreu um erro ao iniciar o pagamento. Tenta novamente.';
}
