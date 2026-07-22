// Identidade visual de cada serviço para os cards.
// glyph = logo oficial (Simple Icons CDN) sobre a cor da marca; quando não há
// logo fiável (serviços de nicho), mostra-se o nome em tipografia forte.
const BRANDS = [
  { key: 'netflix', match: /netflix/i, name: 'Netflix', bg: 'radial-gradient(circle at 50% 42%, #2a0b0b, #0b0b0b)', glyph: 'https://cdn.simpleicons.org/netflix/E50914', glyphSize: '34%' },
  { key: 'spotify', match: /spotify/i, name: 'Spotify', bg: 'radial-gradient(circle at 50% 42%, #1DB954, #0a3d21)', glyph: 'https://cdn.simpleicons.org/spotify/white', glyphSize: '44%' },
  { key: 'unitv', match: /unitv|uni tv/i, name: 'UniTV', bg: 'linear-gradient(135deg, #3a0f0f, #d81f26)', glyph: null },
  { key: 'youcine', match: /youcine|you cine/i, name: 'YouCine', bg: 'linear-gradient(135deg, #3d2e00, #f5a623)', glyph: null },
];

export function brandOf(product) {
  const s = `${product?.name || ''} ${product?.category || ''}`;
  return BRANDS.find(b => b.match.test(s))
    || { key: 'generic', name: product?.name || '', bg: 'linear-gradient(135deg, #17518f, #2b8fd6)', glyph: null };
}
