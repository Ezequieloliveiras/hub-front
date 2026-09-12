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
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { Add, ExpandMore, Publish, Save } from '@mui/icons-material';
import { api, money } from '@/lib/api';
import {
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

export default function MercadoLivreListingForm({ integrationId }: { integrationId: string }) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [draftId, setDraftId] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
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
          ['BRAND', 'MODEL', 'GTIN', 'EAN', 'MPN', 'COLOR', 'SIZE'].includes(attribute.id),
      ),
    [metadata],
  );
  const listingTypes = metadata?.listingTypes?.length
    ? metadata.listingTypes
    : [
        { id: 'gold_special', name: 'Clássico' },
        { id: 'gold_pro', name: 'Premium' },
      ];

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

  const saveDraft = async (status?: string) => {
    setSaving(true);
    try {
      const payload = toListingDraftPayload('MERCADOLIVRE', integrationId, productId, draft);
      const response = draftId
        ? await api.patch(`/listing-creation/drafts/${draftId}`, { ...payload, status })
        : await api.post('/listing-creation/drafts', payload);
      setDraftId(response.data.id);
      setMessage('Rascunho salvo.');
      return response.data.id;
    } finally {
      setSaving(false);
    }
  };

  const searchCategories = async () => {
    if (!categoryQuery.trim()) return;
    const response = await api.get('/listing-creation/mercadolivre/categories/search', {
      params: { q: categoryQuery },
    });
    setCategories(Array.isArray(response.data) ? response.data : []);
  };

  const chooseCategory = async (category: any) => {
    const categoryId = category.category_id || category.id;
    setDraft((current) => ({
      ...current,
      categoryId,
      categoryName: category.category_name || category.name || categoryId,
    }));
    const response = await api.get(
      `/listing-creation/mercadolivre/categories/${categoryId}/metadata`,
    );
    setMetadata(response.data);
    const catalogResponse = await api.get('/listing-creation/mercadolivre/catalog/search', {
      params: { query: draft.title || categoryQuery, categoryId },
    });
    setCatalogOptions(catalogResponse.data?.results || []);
  };

  const validate = async () => {
    const id = await saveDraft('VALIDATING');
    const response = await api.post(`/listing-creation/drafts/${id}/validate`);
    setErrors(response.data.errors || []);
    if (response.data.valid) setMessage('Rascunho pronto para publicação.');
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
      const responseErrors = error?.response?.data?.errors;
      setErrors(Array.isArray(responseErrors) ? responseErrors : []);
      setMessage(error?.response?.data?.message || 'Não foi possível publicar o anúncio.');
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

  return (
    <Stack spacing={2}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step key={step}>
            <StepLabel>{step}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {message && <Alert severity={errors.length ? 'warning' : 'success'}>{message}</Alert>}
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
                  onChange={(event) => setCategoryQuery(event.target.value)}
                />
                <Button variant="outlined" onClick={searchCategories}>
                  Buscar
                </Button>
              </Stack>
              <Grid container spacing={1}>
                {categories.map((category) => {
                  const categoryId = category.category_id || category.id;
                  return (
                    <Grid item xs={12} md={6} key={categoryId}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography fontWeight={800}>
                            {category.category_name || category.name || categoryId}
                          </Typography>
                          <Typography className="muted" variant="body2">
                            {categoryId}
                          </Typography>
                          <Button size="small" onClick={() => chooseCategory(category)}>
                            Escolher categoria
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
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

              <Typography fontWeight={800}>Atributos obrigatórios</Typography>
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
                  <Typography fontWeight={800}>Atributos opcionais importantes</Typography>
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
                    value={draft.quantity}
                    onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography fontWeight={800} mb={1}>
                    Imagens
                  </Typography>
                  <Stack spacing={1}>
                    {draft.pictures.map((picture, index) => (
                      <TextField
                        key={index}
                        fullWidth
                        label={index === 0 ? 'Imagem principal' : `Imagem ${index + 1}`}
                        value={picture}
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
                <Review label="Estoque" value={draft.quantity} />
                <Review label="Tipo" value={draft.listingTypeId} />
                <Review label="Condição" value={draft.condition === 'new' ? 'Novo' : 'Usado'} />
              </Grid>
              {catalogOptions.length > 0 && (
                <Alert severity="info">
                  Encontramos {catalogOptions.length} possível(is) produto(s) de catálogo para esta
                  busca. A vinculação automática de catálogo fica preparada para a próxima etapa.
                </Alert>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {draft.pictures.filter(Boolean).map((picture) => (
                  <Box
                    key={picture}
                    component="img"
                    src={picture}
                    alt="Imagem"
                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1 }}
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
      <Typography fontWeight={800}>{value || '-'}</Typography>
    </Grid>
  );
}
