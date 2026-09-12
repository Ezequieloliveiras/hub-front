export type MercadoLivreAttribute = {
  id: string;
  name: string;
  value_type?: string;
  values?: { id?: string; name: string }[];
  tags?: Record<string, boolean>;
  allowed_units?: { id: string; name: string }[];
};

export type MercadoLivreListingDraft = {
  title: string;
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  condition: string;
  listingTypeId: string;
  price: string;
  quantity: string;
  pictures: string[];
  attributes: Record<string, string>;
  shipping: {
    mode: string;
    freeShipping: boolean;
    localPickup: boolean;
  };
  warranty: string;
  catalogProductId: string;
};

export const emptyMercadoLivreDraft: MercadoLivreListingDraft = {
  title: '',
  sku: '',
  description: '',
  categoryId: '',
  categoryName: '',
  condition: 'new',
  listingTypeId: 'gold_special',
  price: '0,00',
  quantity: '1',
  pictures: [''],
  attributes: {},
  shipping: {
    mode: 'me2',
    freeShipping: false,
    localPickup: false,
  },
  warranty: '',
  catalogProductId: '',
};
