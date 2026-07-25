// Configuração central da loja — edite aqui os dados de marca e contacto.
// Um único sítio para o nome, o WhatsApp e o e-mail usados em todo o site.
export const site = {
  nome: "Gift AO",
  // WhatsApp de suporte (formato internacional sem "+", espaços ou traços).
  whatsapp: "244951257125",
  email: "suporte@kita-di.com",
  // Nome da entidade que processa os pedidos (aparece no rodapé e nos e-mails).
  processadoPor: "ArcVendas Entretenimento",
};

// Monta o link wa.me com uma mensagem pré-preenchida.
export function whatsappLink(mensagem = "") {
  const base = `https://wa.me/${site.whatsapp}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// Serviços cujo pedido é feito manualmente pelo WhatsApp (entrega manual).
const PEDIDO_WHATSAPP = /netflix|spotify/i;

// True se o produto (Netflix/Spotify) deve ser pedido pelo WhatsApp.
export function isWhatsappOrder(product) {
  return PEDIDO_WHATSAPP.test(`${product?.name || ""} ${product?.category || ""}`);
}

// Mensagem pré-preenchida para o pedido de um produto pelo WhatsApp.
export function pedidoWhatsappMsg(product, precoFmt = "") {
  const preco = precoFmt ? ` — ${precoFmt}` : "";
  return `Olá! Quero fazer um pedido na ${site.nome}:\n${product?.name || ""}${preco}\n\nEstá disponível?`;
}
