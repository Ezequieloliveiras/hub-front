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
  listingMode: 'simple' | 'variations';
  price: string;
  quantity: string;
  pictures: string[];
  variations: MercadoLivreVariationDraft[];
  attributes: Record<string, string>;
  shipping: {
    mode: string;
    freeShipping: boolean;
    localPickup: boolean;
  };
  warranty: string;
  catalogProductId: string;
};

export type MercadoLivreVariationDraft = {
  attributeCombinations: Record<string, string>;
  price: string;
  quantity: string;
  sku: string;
  pictureIds: string[];
  attributes: Record<string, string>;
};

export const emptyMercadoLivreVariationDraft: MercadoLivreVariationDraft = {
  attributeCombinations: {},
  price: '0,00',
  quantity: '1',
  sku: '',
  pictureIds: [''],
  attributes: {},
};

export const emptyMercadoLivreDraft: MercadoLivreListingDraft = {
  title: '',
  sku: '',
  description: '',
  categoryId: '',
  categoryName: '',
  condition: 'new',
  listingTypeId: 'gold_special',
  listingMode: 'simple',
  price: '0,00',
  quantity: '1',
  pictures: [''],
  variations: [],
  attributes: {},
  shipping: {
    mode: 'me2',
    freeShipping: false,
    localPickup: false,
  },
  warranty: '',
  catalogProductId: '',
};
