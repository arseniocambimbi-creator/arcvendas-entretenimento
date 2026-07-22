import { MonitorPlay, Gamepad2, Gift, Tag } from 'lucide-react';

// Categorias da loja. Preparado para escalar (Gaming, Gift Cards, etc.).
// `slug` casa com o campo `category` dos produtos (em minúsculas).
// `especial: 'ofertas'` filtra por desconto em vez de categoria.
export const categories = [
  { id: 'streaming', nome: 'Streaming', Icon: MonitorPlay, slug: 'streaming', desc: 'Netflix, Spotify, YouCine, UniTV' },
  { id: 'gaming', nome: 'Gaming', Icon: Gamepad2, slug: 'gaming', desc: 'Free Fire, PUBG, Steam', brevemente: true },
  { id: 'giftcards', nome: 'Gift Cards', Icon: Gift, slug: 'gift cards', desc: 'PlayStation, Xbox, Roblox', brevemente: true },
  { id: 'ofertas', nome: 'Ofertas', Icon: Tag, slug: null, especial: 'ofertas', desc: 'Os melhores descontos' },
];
