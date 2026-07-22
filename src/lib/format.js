// Helpers partilhados de formatação.
export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-AO', {
    style: 'currency', currency: 'AOA', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value || 0).replace('AOA', 'Kz');

// Percentagem de desconto (inteiro) entre preço original e promocional.
export const discountPercent = (original, promo) => {
  if (!original || !promo || promo >= original) return 0;
  return Math.round(((original - promo) / original) * 100);
};

// Normaliza texto para pesquisa (sem acentos, minúsculas).
export const normalize = (s) =>
  (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
