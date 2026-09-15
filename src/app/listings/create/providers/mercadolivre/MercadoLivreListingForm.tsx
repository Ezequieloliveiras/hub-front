'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline, ExpandMore, Publish, Save } from '@mui/icons-material';
import { api, money } from '@/lib/api';
import {
  emptyMercadoLivreVariationDraft,
  emptyMercadoLivreDraft,
  MercadoLivreAttribute,
  MercadoLivreListingDraft,
} from './mercadolivreListingSchema';
import {
  formatBrazilianMoneyFromDigits,
  parseBrazilianMoney,
  toListingDraftPayload,
} from './mercadolivreListingMapper';

const steps = ['Produto', 'Categoria', 'Informações', 'Preço e envio', 'Revisão'];

type MercadoLivreCategoryOption = {
  id?: string;
  name?: string;
  category_id?: string;
  category_name?: string;
  totalItems?: number;
  total_items_in_this_category?: number;
  children_categories?: MercadoLivreCategoryOption[];
};

const categoryIdOf = (category: MercadoLivreCategoryOption) =>
  String(category.category_id || category.id || '').trim();

const categoryNameOf = (category: MercadoLivreCategoryOption) =>
  String(category.category_name || category.name || categoryIdOf(category)).trim();

const normalizeCategory = (category: MercadoLivreCategoryOption): MercadoLivreCategoryOption => ({
  ...category,
  id: categoryIdOf(category),
  name: categoryNameOf(category),
});

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function MercadoLivreListingForm({ integrationId }: { integrationId: string }) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [draftId, setDraftId] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSeverity, setMessageSeverity] = useState<'success' | 'info' | 'warning' | 'error'>(
    'success',
  );
  const [errors, setErrors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categories, setCategories] = useState<MercadoLivreCategoryOption[]>([]);
  const [categoryTrail, setCategoryTrail] = useState<MercadoLivreCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState('');
  const [metadata, setMetadata] = useState<any>();
  const [catalogOptions, setCatalogOptions] = useState<any[]>([]);
  const [draft, setDraft] = useState<MercadoLivreListingDraft>(emptyMercadoLivreDraft);

  const requiredAttributes: MercadoLivreAttribute[] = useMemo(
    () => (metadata?.attributes || []).filter((attribute: any) => attribute?.tags?.required),
    [metadata],
  );
  const optionalAttributes: MercadoLivreAttribute[] = useMemo(
    () =>
      (metadata?.attributes || []).filter(
        (attribute: any) =>
          !attribute?.tags?.required &&
          ['BRAND', 'MODEL', 'GTIN', 'EMPTY_GTIN_REASON', 'EAN', 'MPN', 'COLOR', 'SIZE'].includes(
            attribute.id,
          ),
      ),
    [metadata],
  );
  const variationAttributes: MercadoLivreAttribute[] = useMemo(
    () =>
      (metadata?.variationAttributes?.length
        ? metadata.variationAttributes
        : (metadata?.attributes || []).filter(
            (attribute: any) => attribute?.tags?.variation_attribute,
          )
      ).slice(0, 3),
    [metadata],
  );
  const totalVariationStock = useMemo(
    () =>
      draft.variations.reduce(
        (total, variation) => total + Math.max(0, Number(variation.quantity || 0)),
        0,
      ),
    [draft.variations],
  );
  const listingTypes = metadata?.listingTypes?.length
    ? metadata.listingTypes
    : [
        { id: 'gold_special', name: 'Clássico' },
        { id: 'gold_pro', name: 'Premium' },
      ];

  const visibleCategories = useMemo(() => {
    const query = normalizeSearchText(categoryQuery);
    if (!query || /^mlb\d+$/i.test(query)) return categories;

    return categories.filter((category) => {
      const searchable = normalizeSearchText(
        `${categoryNameOf(category)} ${categoryIdOf(category)}`,
      );
      return searchable.includes(query);
    });
  }, [categories, categoryQuery]);

  useEffect(() => {
    api.get('/products').then((response) => setProducts(response.data || []));
  }, []);

  useEffect(() => {
    if (!productId) return;
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setDraft((current) => ({
      ...current,
      title: current.title || product.name || '',
      sku: current.sku || product.sku || '',
      pictures: product.imageUrl ? [product.imageUrl] : current.pictures,
    }));
  }, [productId, products]);

  useEffect(() => {
    if (activeStep === 1 && !categories.length && !loadingCategories) {
      loadRootCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const saveDraft = async (status?: string) => {
    setSaving(true);
    try {
      const payload = toListingDraftPayload('MERCADOLIVRE', integrationId, productId, draft);
      const response = draftId
        ? await api.patch(`/listing-creation/drafts/${draftId}`, { ...payload, status })
        : await api.post('/listing-creation/drafts', payload);
      setDraftId(response.data.id);
      setMessageSeverity('success');
      setMessage('Rascunho salvo.');
      return response.data.id;
    } finally {
      setSaving(false);
    }
  };

  const loadRootCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get('/listing-creation/mercadolivre/categories/root');
      const items = Array.isArray(response.data) ? response.data.map(normalizeCategory) : [];
      setCategories(items);
      setCategoryTrail([]);
      setCategoryNotice('Categorias principais do Mercado Livre.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategoryChildren = async (
    category: MercadoLivreCategoryOption,
    trail?: MercadoLivreCategoryOption[],
  ) => {
    const categoryId = categoryIdOf(category);
    if (!categoryId) return;
    setLoadingCategories(true);
    try {
      const response = await api.get(
        `/listing-creation/mercadolivre/categories/${categoryId}/children`,
      );
      const currentCategory = normalizeCategory(response.data?.category || category);
      const children = Array.isArray(response.data?.children)
        ? response.data.children.map(normalizeCategory)
        : [];

      if (!children.length) {
        await chooseCategory(currentCategory);
        return;
      }

      setCategories(children);
      setCategoryTrail(trail || [...categoryTrail, currentCategory]);
      setCategoryNotice('Escolha uma subcategoria ou continue navegando.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const backCategoryLevel = async () => {
    if (categoryTrail.length <= 1) {
      await loadRootCategories();
      return;
    }

    const nextTrail = categoryTrail.slice(0, -1);
    const parent = nextTrail[nextTrail.length - 1];
    await loadCategoryChildren(parent, nextTrail);
  };

  const searchCategories = async () => {
    const query = (categoryQuery.trim() || draft.title.trim()).trim();
    if (!query) {
      await loadRootCategories();
      return;
    }

    const categoryIdQuery = query.toUpperCase();
    if (/^MLB\d+$/.test(categoryIdQuery)) {
      await loadCategoryChildren({ id: categoryIdQuery, name: categoryIdQuery });
      return;
    }

    setLoadingCategories(true);
    try {
      const response = await api.get('/listing-creation/mercadolivre/categories/search', {
        params: { q: query },
      });
      const items = Array.isArray(response.data) ? response.data.map(normalizeCategory) : [];
      setCategories(items);
      setCategoryTrail([]);
      setCategoryNotice(
        items.length
          ? 'Sugestões do Mercado Livre para esta busca.'
          : 'Nenhuma categoria encontrada. Tente buscar pelo nome do produto.',
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  const chooseCategory = async (category: any) => {
    const categoryId = categoryIdOf(category);
    const categoryName = categoryNameOf(category);
    setDraft((current) => ({
      ...current,
      categoryId,
      categoryName,
    }));
    const response = await api.get(
      `/listing-creation/mercadolivre/categories/${categoryId}/metadata`,
    );
    setMetadata(response.data);
    const catalogResponse = await api.get('/listing-creation/mercadolivre/catalog/search', {
      params: { query: draft.title || categoryQuery || categoryName, categoryId },
    });
    setCatalogOptions(catalogResponse.data?.results || []);
    setCategoryNotice(`Categoria selecionada: ${categoryName} (${categoryId}).`);
  };

  const validate = async () => {
    const id = await saveDraft('VALIDATING');
    const response = await api.post(`/listing-creation/drafts/${id}/validate`);
    setErrors(response.data.errors || []);
    if (response.data.valid) {
      setMessageSeverity('success');
      setMessage('Rascunho pronto para publicação.');
    } else {
      setMessageSeverity('error');
      setMessage('Corrija os campos indicados antes de publicar.');
    }
    return response.data.valid;
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const valid = await validate();
      if (!valid) return;
      const response = await api.post(`/listing-creation/drafts/${draftId}/publish`);
      router.push(`/listings/${response.data.id}`);
    } catch (error: any) {
      const responseData = error?.response?.data;
      const responseErrors = responseData?.errors || responseData?.message?.errors;
      const responseMessage =
        typeof responseData?.message === 'string'
          ? responseData.message
          : responseData?.message?.message;
      setErrors(Array.isArray(responseErrors) ? responseErrors : []);
      setMessageSeverity('error');
      setMessage(responseMessage || 'Não foi possível publicar o anúncio.');
    } finally {
      setPublishing(false);
    }
  };

  const next = async () => {
    await saveDraft();
    setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const setAttribute = (id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      attributes: { ...current.attributes, [id]: value },
    }));
  };

  const updateVariation = (index: number, patch: Partial<(typeof draft.variations)[number]>) => {
    setDraft((current) => ({
      ...current,
      variations: current.variations.map((variation, itemIndex) =>
        itemIndex === index ? { ...variation, ...patch } : variation,
      ),
    }));
  };

  const setVariationCombination = (index: number, attributeId: string, value: string) => {
    setDraft((current) => ({
      ...current,
      variations: current.variations.map((variation, itemIndex) =>
        itemIndex === index
          ? {
              ...variation,
              attributeCombinations: {
                ...variation.attributeCombinations,
                [attributeId]: value,
              },
            }
          : variation,
      ),
    }));
  };

  const addVariation = (seed: Partial<typeof emptyMercadoLivreVariationDraft> = {}) => {
    setDraft((current) => ({
      ...current,
      listingMode: 'variations',
      variations: [
        ...current.variations,
        {
          ...emptyMercadoLivreVariationDraft,
          price: current.price || '0,00',
          pictureIds: current.pictures.filter(Boolean).slice(0, 1),
          ...seed,
        },
      ],
    }));
  };

  const generateVariations = () => {
    const attribute =
      variationAttributes.find((item) => item.values?.length) || variationAttributes[0];
    if (!attribute?.id) {
      addVariation();
      return;
    }

    const values = (attribute.values || []).slice(0, 12);
    if (!values.length) {
      addVariation({ attributeCombinations: { [attribute.id]: '' } });
      return;
    }

    setDraft((current) => ({
      ...current,
      listingMode: 'variations',
      variations: values.map((value) => ({
        ...emptyMercadoLivreVariationDraft,
        attributeCombinations: { [attribute.id]: value.name },
        price: current.price || '0,00',
        quantity: '1',
        pictureIds: current.pictures.filter(Boolean).slice(0, 1),
      })),
    }));
  };

  return (
    <Stack spacing={2}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step key={step}>
            <StepLabel>{step}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {message && <Alert severity={messageSeverity}>{message}</Alert>}
      {errors.length > 0 && (
        <Alert severity="error">
          {errors.slice(0, 5).map((error) => (
            <div key={`${error.field}-${error.message}`}>
              {error.field}: {error.message}
            </div>
          ))}
        </Alert>
      )}

      <Card>
        <CardContent>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Produto local"
                  value={productId}
                  helperText="Opcional. Use um produto existente para preencher nome, SKU e imagem."
                  onChange={(event) => setProductId(event.target.value)}
                >
                  <MenuItem value="">Criar do zero</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - SKU {product.sku}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Título"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={draft.sku}
                  onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Descrição"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  fullWidth
                  label="Buscar categoria"
                  value={categoryQuery}
                  helperText="Busque pelo nome do produto/categoria ou informe um ID como MLB7022."
                  onChange={(event) => setCategoryQuery(event.target.value)}
                />
                <Button variant="outlined" disabled={loadingCategories} onClick={searchCategories}>
                  {loadingCategories ? 'Buscando...' : 'Buscar'}
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" onClick={loadRootCategories}>
                  Categorias principais
                </Button>
                {categoryTrail.length > 0 && (
                  <Button size="small" onClick={backCategoryLevel}>
                    Voltar categoria
                  </Button>
                )}
                {categoryTrail.map((category) => (
                  <Chip
                    key={categoryIdOf(category)}
                    size="small"
                    label={categoryNameOf(category)}
                  />
                ))}
              </Stack>

              {categoryNotice && <Alert severity="info">{categoryNotice}</Alert>}

              {categoryQuery.trim() && categories.length > 0 && (
                <Typography className="muted" variant="body2">
                  Mostrando {visibleCategories.length} de {categories.length} categorias nesta
                  lista. Use Buscar para consultar no Mercado Livre inteiro.
                </Typography>
              )}

              <Grid container spacing={1}>
                {visibleCategories.map((category) => {
                  const categoryId = categoryIdOf(category);
                  const categoryName = categoryNameOf(category);
                  const totalItems =
                    category.totalItems ?? category.total_items_in_this_category ?? null;
                  return (
                    <Grid item xs={12} md={6} key={categoryId}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography fontWeight={600}>{categoryName}</Typography>
                          <Typography className="muted" variant="body2">
                            {categoryId}
                            {totalItems !== null ? ` - ${totalItems} anúncios` : ''}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={1}>
                            <Button size="small" onClick={() => loadCategoryChildren(category)}>
                              Abrir
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => chooseCategory(category)}
                            >
                              Escolher
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              {!loadingCategories && !categories.length && (
                <Alert severity="warning">
                  Nenhuma categoria carregada. Clique em Categorias principais ou busque pelo nome
                  do produto.
                </Alert>
              )}
              {!loadingCategories && categories.length > 0 && visibleCategories.length === 0 && (
                <Alert severity="warning">
                  Nenhuma categoria desta lista corresponde ao filtro. Clique em Buscar para fazer
                  uma busca global no Mercado Livre.
                </Alert>
              )}
              {draft.categoryId && (
                <Alert severity="info">
                  Categoria selecionada: {draft.categoryName || draft.categoryId}
                </Alert>
              )}
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Condição"
                    value={draft.condition}
                    onChange={(event) => setDraft({ ...draft, condition: event.target.value })}
                  >
                    <MenuItem value="new">Novo</MenuItem>
                    <MenuItem value="used">Usado</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de anúncio"
                    value={draft.listingTypeId}
                    onChange={(event) => setDraft({ ...draft, listingTypeId: event.target.value })}
                  >
                    {listingTypes.map((type: any) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name || type.id} ({type.id})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Typography fontWeight={600}>Atributos obrigatórios</Typography>
              <Grid container spacing={2}>
                {requiredAttributes.map((attribute) => (
                  <Grid item xs={12} sm={6} key={attribute.id}>
                    <AttributeField
                      attribute={attribute}
                      value={draft.attributes[attribute.id] || ''}
                      onChange={(value) => setAttribute(attribute.id, value)}
                    />
                  </Grid>
                ))}
                {!requiredAttributes.length && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Escolha uma categoria para carregar atributos obrigatórios.
                    </Alert>
                  </Grid>
                )}
              </Grid>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight={600}>Atributos opcionais importantes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {optionalAttributes.map((attribute) => (
                      <Grid item xs={12} sm={6} key={attribute.id}>
                        <AttributeField
                          attribute={attribute}
                          value={draft.attributes[attribute.id] || ''}
                          onChange={(value) => setAttribute(attribute.id, value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>
          )}

          {activeStep === 3 && (
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={600} mb={1}>
                  Estrutura do anuncio
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={draft.listingMode}
                  onChange={(_, value) => {
                    if (!value) return;
                    setDraft({
                      ...draft,
                      listingMode: value,
                      variations:
                        value === 'variations' && !draft.variations.length
                          ? [
                              {
                                ...emptyMercadoLivreVariationDraft,
                                price: draft.price,
                                pictureIds: draft.pictures.filter(Boolean).slice(0, 1),
                              },
                            ]
                          : draft.variations,
                    });
                  }}
                >
                  <ToggleButton value="simple">Simples</ToggleButton>
                  <ToggleButton value="variations">Com variacoes</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preço"
                    value={draft.price}
                    InputProps={{ startAdornment: <Typography mr={1}>R$</Typography> }}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        price: formatBrazilianMoneyFromDigits(event.target.value),
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Estoque"
                    disabled={draft.listingMode === 'variations'}
                    helperText={
                      draft.listingMode === 'variations'
                        ? 'No modo com variacoes, o estoque vem das linhas abaixo.'
                        : ''
                    }
                    value={draft.quantity}
                    onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography fontWeight={600} mb={1}>
                    Imagens
                  </Typography>
                  <Stack spacing={1}>
                    {draft.pictures.map((picture, index) => (
                      <TextField
                        key={index}
                        fullWidth
                        label={index === 0 ? 'Imagem principal' : `Imagem ${index + 1}`}
                        value={picture}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              edge="end"
                              aria-label="Excluir imagem"
                              disabled={draft.pictures.length === 1}
                              onClick={() => {
                                const pictures = draft.pictures.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                );
                                setDraft({ ...draft, pictures: pictures.length ? pictures : [''] });
                              }}
                            >
                              <DeleteOutline />
                            </IconButton>
                          ),
                        }}
                        onChange={(event) => {
                          const pictures = [...draft.pictures];
                          pictures[index] = event.target.value;
                          setDraft({ ...draft, pictures });
                        }}
                      />
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={() => setDraft({ ...draft, pictures: [...draft.pictures, ''] })}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Adicionar imagem
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
              {draft.listingMode === 'variations' && (
                <Box>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={1}
                    mb={1}
                  >
                    <Box>
                      <Typography fontWeight={600}>Variacoes</Typography>
                      <Typography className="muted" variant="body2">
                        Cada linha vira uma opcao compravel no mesmo anuncio. Estoque total:{' '}
                        <strong>{totalVariationStock}</strong>
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={generateVariations}>
                        Gerar opcoes
                      </Button>
                      <Button size="small" startIcon={<Add />} onClick={() => addVariation()}>
                        Adicionar
                      </Button>
                    </Stack>
                  </Stack>
                  {!variationAttributes.length && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Escolha a categoria antes de montar as variacoes.
                    </Alert>
                  )}
                  <Stack spacing={1.5}>
                    {draft.variations.map((variation, index) => (
                      <Box
                        key={index}
                        sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}
                      >
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1.5}
                          alignItems={{ xs: 'stretch', md: 'flex-start' }}
                        >
                          <Grid container spacing={1.5} flex={1}>
                            {variationAttributes.map((attribute) => (
                              <Grid item xs={12} sm={6} md={3} key={attribute.id}>
                                <AttributeField
                                  attribute={attribute}
                                  value={variation.attributeCombinations[attribute.id] || ''}
                                  onChange={(value) =>
                                    setVariationCombination(index, attribute.id, value)
                                  }
                                />
                              </Grid>
                            ))}
                            <Grid item xs={12} sm={6} md={2}>
                              <TextField
                                fullWidth
                                label="Preco"
                                value={variation.price}
                                InputProps={{
                                  startAdornment: <Typography mr={1}>R$</Typography>,
                                }}
                                onChange={(event) =>
                                  updateVariation(index, {
                                    price: formatBrazilianMoneyFromDigits(event.target.value),
                                  })
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Estoque"
                                value={variation.quantity}
                                onChange={(event) =>
                                  updateVariation(index, { quantity: event.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                              <TextField
                                fullWidth
                                label="SKU"
                                value={variation.sku}
                                onChange={(event) =>
                                  updateVariation(index, { sku: event.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                select
                                fullWidth
                                label="Imagem"
                                value={variation.pictureIds[0] || ''}
                                onChange={(event) =>
                                  updateVariation(index, { pictureIds: [event.target.value] })
                                }
                              >
                                <MenuItem value="">Selecionar</MenuItem>
                                {draft.pictures.filter(Boolean).map((picture, pictureIndex) => (
                                  <MenuItem key={`${picture}-${pictureIndex}`} value={picture}>
                                    Imagem {pictureIndex + 1}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Grid>
                          </Grid>
                          <IconButton
                            aria-label="Remover variacao"
                            disabled={draft.variations.length === 1}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                variations: draft.variations.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              })
                            }
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
              <Divider />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={draft.shipping.freeShipping}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          shipping: { ...draft.shipping, freeShipping: event.target.checked },
                        })
                      }
                    />
                  }
                  label="Frete grátis"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={draft.shipping.localPickup}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          shipping: { ...draft.shipping, localPickup: event.target.checked },
                        })
                      }
                    />
                  }
                  label="Retirada local"
                />
              </Stack>
              <TextField
                fullWidth
                label="Garantia"
                value={draft.warranty}
                onChange={(event) => setDraft({ ...draft, warranty: event.target.value })}
              />
            </Stack>
          )}

          {activeStep === 4 && (
            <Stack spacing={2}>
              <Alert severity="warning">
                Nada será publicado automaticamente. O anúncio real só será criado ao clicar em
                PUBLICAR NO MERCADO LIVRE.
              </Alert>
              <Grid container spacing={2}>
                <Review label="Marketplace" value="Mercado Livre" />
                <Review label="Título" value={draft.title} />
                <Review label="Categoria" value={draft.categoryName || draft.categoryId} />
                <Review label="Preço" value={money(parseBrazilianMoney(draft.price))} />
                <Review
                  label="Estoque"
                  value={
                    draft.listingMode === 'variations'
                      ? `${totalVariationStock} em ${draft.variations.length} variacoes`
                      : draft.quantity
                  }
                />
                <Review label="Tipo" value={draft.listingTypeId} />
                <Review label="Condição" value={draft.condition === 'new' ? 'Novo' : 'Usado'} />
              </Grid>
              {draft.listingMode === 'variations' && (
                <Box>
                  <Typography fontWeight={600} mb={1}>
                    Variacoes
                  </Typography>
                  <Stack spacing={1}>
                    {draft.variations.map((variation, index) => (
                      <Box
                        key={index}
                        sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.25 }}
                      >
                        <Typography fontWeight={600}>
                          {formatVariationName(variation.attributeCombinations) ||
                            `Variacao ${index + 1}`}
                        </Typography>
                        <Typography className="muted" variant="body2">
                          {money(parseBrazilianMoney(variation.price))} - {variation.quantity} un.
                          {variation.sku ? ` - SKU ${variation.sku}` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
              {catalogOptions.length > 0 && (
                <Alert severity="info">
                  Encontramos {catalogOptions.length}{' '}
                  {catalogOptions.length === 1 ? 'possível produto' : 'possíveis produtos'} de
                  catálogo para esta busca. A vinculação automática de catálogo fica preparada para
                  a próxima etapa.
                </Alert>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {draft.pictures.filter(Boolean).map((picture) => (
                  <Box
                    key={picture}
                    component="img"
                    src={picture}
                    alt="Imagem"
                    sx={{
                      width: 72,
                      height: 72,
                      objectFit: 'contain',
                      borderRadius: 1,
                      bgcolor: '#fff',
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)}>
          Voltar
        </Button>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Save />} disabled={saving} onClick={() => saveDraft()}>
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={next}>
              Continuar
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={publishing ? <CircularProgress size={16} /> : <Publish />}
              disabled={publishing}
              onClick={publish}
            >
              Publicar no Mercado Livre
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

function AttributeField({
  attribute,
  value,
  onChange,
}: {
  attribute: MercadoLivreAttribute;
  value: string;
  onChange: (value: string) => void;
}) {
  if (attribute.values?.length) {
    return (
      <TextField
        select
        fullWidth
        required={Boolean(attribute.tags?.required)}
        label={attribute.name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {attribute.values.map((item) => (
          <MenuItem key={item.id || item.name} value={item.name}>
            {item.name}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      fullWidth
      required={Boolean(attribute.tags?.required)}
      label={attribute.name}
      value={value}
      type={
        attribute.value_type === 'number' || attribute.value_type === 'number_unit'
          ? 'number'
          : 'text'
      }
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Review({ label, value }: { label: string; value: any }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Typography className="muted" variant="caption">
        {label}
      </Typography>
      <Typography fontWeight={600}>{value || '-'}</Typography>
    </Grid>
  );
}

function formatVariationName(attributeCombinations: Record<string, string>) {
  return Object.entries(attributeCombinations || {})
    .filter(([, value]) => Boolean(value))
    .map(([id, value]) => `${id}: ${value}`)
    .join(' / ');
}
