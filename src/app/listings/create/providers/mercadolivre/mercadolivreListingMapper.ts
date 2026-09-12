import { MercadoLivreListingDraft } from './mercadolivreListingSchema';

export function parseBrazilianMoney(value: string) {
  const cleanValue = String(value || '').replace(/[^\d,.]/g, '');
  if (!cleanValue) return 0;
  return Number(cleanValue.replace(/\./g, '').replace(',', '.'));
}

export function formatBrazilianMoneyFromDigits(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  const amount = digits ? Number(digits) / 100 : 0;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toListingDraftPayload(
  marketplace: string,
  integrationId: string,
  productId: string,
  draft: MercadoLivreListingDraft,
) {
  return {
    marketplace,
    integrationId,
    productId: productId || undefined,
    categoryId: draft.categoryId || undefined,
    data: {
      ...draft,
      price: parseBrazilianMoney(draft.price),
      quantity: Number(draft.quantity || 0),
      pictures: draft.pictures.map((picture) => picture.trim()).filter(Boolean),
    },
  };
}
