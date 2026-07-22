// Categorias da loja. Preparado para escalar (Gaming, Gift Cards, etc.).
// `slug` casa com o campo `category` dos produtos (em minúsculas).
// `especial: 'ofertas'` filtra por desconto em vez de categoria.
export const categories = [
  { id: 'streaming', nome: 'Streaming', emoji: '🎬', slug: 'streaming', desc: 'Netflix, Spotify, YouCine, UniTV' },
  { id: 'gaming', nome: 'Gaming', emoji: '🎮', slug: 'gaming', desc: 'Free Fire, PUBG, Steam', brevemente: true },
  { id: 'giftcards', nome: 'Gift Cards', emoji: '🎁', slug: 'gift cards', desc: 'PlayStation, Xbox, Roblox', brevemente: true },
  { id: 'ofertas', nome: 'Ofertas', emoji: '🔥', especial: 'ofertas', desc: 'Os melhores descontos' },
];
