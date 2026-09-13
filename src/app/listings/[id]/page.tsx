'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  DeleteOutline,
  Edit,
  ImageSearch,
  MoreVert,
  OpenInNew,
  PauseCircle,
  PhotoCamera,
  PlayCircle,
  Sync,
  WarningAmber,
} from '@mui/icons-material';
import Shell from '@/components/Shell';
import { LabelWithInfo } from '@/components/InfoHint';
import { api, money } from '@/lib/api';

type ConfirmAction = 'pause' | 'activate' | 'close' | null;
type ListingTypeOption = { id: string; name: string; current?: boolean };
type CategoryOption = { id: string; name: string; current?: boolean };

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  closed: 'Encerrado',
};

const defaultListingTypeOptions: ListingTypeOption[] = [
  { id: 'gold_special', name: 'Classico' },
  { id: 'gold_pro', name: 'Premium' },
];

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [listing, setListing] = useState<any>();
  const [err, setErr] = useState('');
  const [loadingAction, setLoadingAction] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [snackbar, setSnackbar] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [listingTypeOptions, setListingTypeOptions] = useState<ListingTypeOption[]>([]);
  const [loadingListingTypes, setLoadingListingTypes] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [form, setForm] = useState({
    title: '',
    price: '',
    cost: '',
    quantity: '',
    pictureUrls: [''],
    listingTypeId: '',
    categoryId: '',
  });

  const raw = listing?.rawPayload || {};
  const capabilities = listing?.capabilities || {};
  const status = String(listing?.status || '').toLowerCase();
  const margin30Days = listing?.performance?.last30Days?.margin;
  const rawPictureUrls = useMemo(
    () =>
      Array.isArray(raw.pictures)
        ? raw.pictures
            .map((picture: any) =>
              normalizeMercadoLivreImageUrl(picture.secure_url || picture.url || picture.source),
            )
            .filter(Boolean)
        : [],
    [raw],
  );
  const productImageUrl = normalizeMercadoLivreImageUrl(listing?.product?.imageUrl);
  const imageUrl = !imageFailed
    ? rawPictureUrls[0] || normalizeMercadoLivreImageUrl(listing?.imageUrl) || productImageUrl
    : '';
  const modalImageUrl = normalizeMercadoLivreImageUrl(previewImageUrl) || imageUrl;
  const currentPictureUrls = rawPictureUrls.length ? rawPictureUrls : imageUrl ? [imageUrl] : [];
  const listingTypeSelectOptions = useMemo(() => {
    const optionsById = new Map<string, ListingTypeOption>();

    [...listingTypeOptions, ...defaultListingTypeOptions].forEach((option) => {
      if (!option.id || optionsById.has(option.id)) return;
      optionsById.set(option.id, option);
    });

    if (form.listingTypeId && !optionsById.has(form.listingTypeId)) {
      optionsById.set(form.listingTypeId, { id: form.listingTypeId, name: form.listingTypeId });
    }

    return [...optionsById.values()]
      .map((option) => ({ ...option, current: option.id === form.listingTypeId }))
      .sort((a, b) => Number(b.current) - Number(a.current));
  }, [form.listingTypeId, listingTypeOptions]);
  const categorySelectOptions = useMemo(() => {
    const optionsById = new Map<string, CategoryOption>();

    categoryOptions.forEach((option) => {
      if (!option.id || optionsById.has(option.id)) return;
      optionsById.set(option.id, option);
    });

    if (form.categoryId && !optionsById.has(form.categoryId)) {
      optionsById.set(form.categoryId, { id: form.categoryId, name: form.categoryId });
    }

    return [...optionsById.values()]
      .map((option) => ({ ...option, current: option.id === form.categoryId }))
      .sort((a, b) => Number(b.current) - Number(a.current));
  }, [categoryOptions, form.categoryId]);

  const condition = useMemo(() => {
    const value =
      raw.attributes?.find((item: any) => item.id === 'ITEM_CONDITION')?.value_name ||
      raw.condition;
    if (value === 'new') return 'Novo';
    if (value === 'used') return 'Usado';
    return value || 'Nao informado';
  }, [raw]);

  const load = async (listingId: string) => {
    setErr('');
    try {
      const response = await api.get(`/listings/${listingId}`);
      setListing(response.data);
      setForm({
        title: response.data.title || '',
        price: formatBrazilianCurrencyInput(response.data.price),
        cost:
          response.data.product?.cost || response.data.product?.cost === 0
            ? formatBrazilianCurrencyInput(response.data.product.cost)
            : '',
        quantity: String(response.data.availableQuantity ?? ''),
        pictureUrls: Array.isArray(response.data.rawPayload?.pictures)
          ? response.data.rawPayload.pictures
              .map((picture: any) =>
                normalizeMercadoLivreImageUrl(picture.secure_url || picture.url || picture.source),
              )
              .filter(Boolean)
          : response.data.imageUrl
            ? [normalizeMercadoLivreImageUrl(response.data.imageUrl)]
            : [''],
        listingTypeId: response.data.rawPayload?.listing_type_id || '',
        categoryId: response.data.rawPayload?.category_id || '',
      });
      setImageFailed(false);
      loadListingTypeOptions(listingId);
      loadCategoryOptions(listingId);
    } catch {
      setErr('Nao foi possivel carregar este anuncio.');
    }
  };

  const loadListingTypeOptions = async (listingId: string) => {
    setLoadingListingTypes(true);
    try {
      const response = await api.get(`/listings/${listingId}/listing-types`);
      setListingTypeOptions(Array.isArray(response.data?.options) ? response.data.options : []);
    } catch {
      setListingTypeOptions([]);
    } finally {
      setLoadingListingTypes(false);
    }
  };

  const loadCategoryOptions = async (listingId: string) => {
    setLoadingCategories(true);
    try {
      const response = await api.get(`/listings/${listingId}/categories`);
      setCategoryOptions(Array.isArray(response.data?.options) ? response.data.options : []);
    } catch {
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    let active = true;

    params.then(({ id: listingId }) => {
      if (!active) return;
      setId(listingId);
      load(listingId);
    });

    return () => {
      active = false;
    };
  }, [params]);

  const run = async (label: string, fn: () => Promise<void>, success: string) => {
    setLoadingAction(label);
    try {
      await fn();
      await load(id);
      setSnackbar(success);
    } catch (error: any) {
      setSnackbar(error?.response?.data?.message || 'Nao foi possivel concluir a acao.');
    } finally {
      setLoadingAction('');
      setConfirmAction(null);
      setMenuAnchor(null);
    }
  };

  const saveEdit = async () => {
    const calls: Promise<any>[] = [];
    const nextPrice = parseBrazilianCurrencyInput(form.price);
    const nextCost = form.cost ? parseBrazilianCurrencyInput(form.cost) : null;
    const nextQuantity = Number(form.quantity);
    const nextTitle = form.title.trim();
    const nextPictureUrls = form.pictureUrls.map((value) => value.trim()).filter(Boolean);
    const currentPictures = currentPictureUrls.join('\n');
    const nextPictures = nextPictureUrls.join('\n');
    const nextListingTypeId = form.listingTypeId.trim();
    const nextCategoryId = form.categoryId.trim();

    if (nextPrice !== Number(listing.price)) {
      calls.push(api.patch(`/listings/${id}/price`, { price: nextPrice }));
    }
    if (
      listing.product?.id &&
      nextCost !== null &&
      nextCost !== Number(listing.product.cost || 0)
    ) {
      calls.push(api.patch(`/products/${listing.product.id}/cost`, { cost: nextCost }));
    }
    if (nextQuantity !== Number(listing.availableQuantity)) {
      calls.push(api.patch(`/listings/${id}/stock`, { quantity: nextQuantity }));
    }
    if (nextTitle && nextTitle !== listing.title) {
      calls.push(api.patch(`/listings/${id}/title`, { title: nextTitle }));
    }
    if (nextPictureUrls.length && nextPictures !== currentPictures) {
      calls.push(api.patch(`/listings/${id}/pictures`, { sources: nextPictureUrls }));
    }
    if (nextListingTypeId && nextListingTypeId !== raw.listing_type_id) {
      calls.push(api.patch(`/listings/${id}/listing-type`, { listingTypeId: nextListingTypeId }));
    }
    if (nextCategoryId && nextCategoryId !== raw.category_id) {
      calls.push(api.patch(`/listings/${id}/category`, { categoryId: nextCategoryId }));
    }

    if (!calls.length) {
      setEditOpen(false);
      return;
    }

    await run(
      'edit',
      async () => {
        await Promise.all(calls);
        setEditOpen(false);
      },
      'Anuncio atualizado com sucesso.',
    );
  };

  const confirmCopy = {
    pause: {
      title: 'Pausar anuncio',
      text: 'Enquanto estiver pausado, ele deixara de ficar disponivel para novas vendas no Mercado Livre.',
      action: 'Pausar anuncio',
      loading: 'Pausando...',
    },
    activate: {
      title: 'Reativar anuncio',
      text: 'O anuncio voltara a ficar disponivel no Mercado Livre se as regras da plataforma permitirem.',
      action: 'Reativar anuncio',
      loading: 'Reativando...',
    },
    close: {
      title: 'Encerrar anuncio',
      text: 'Essa acao pode nao ser reversivel. O Mercado Livre informa que anuncios encerrados nao podem ser ativados novamente, mas podem ser republicados.',
      action: 'Encerrar anuncio',
      loading: 'Encerrando...',
    },
  };
  const isBusy = Boolean(loadingAction);
  const isConfirmActionLoading = confirmAction ? loadingAction === confirmAction : false;

  const openConfirmAction = (action: Exclude<ConfirmAction, null>) => {
    setMenuAnchor(null);
    setConfirmAction(action);
  };

  const closeConfirmAction = () => {
    if (isConfirmActionLoading) return;
    setConfirmAction(null);
  };

  if (err) {
    return (
      <Shell>
        <div className="page">
          <Alert severity="error">{err}</Alert>
          <Button component={Link} href="/listings" startIcon={<ArrowBack />} sx={{ mt: 2 }}>
            Voltar para anuncios
          </Button>
        </div>
      </Shell>
    );
  }

  if (!listing) {
    return (
      <Shell>
        <Box className="page" sx={{ display: 'grid', placeItems: 'center', minHeight: 360 }}>
          <CircularProgress />
        </Box>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="page">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
          mb={3}
        >
          <Box>
            <Button component={Link} href="/listings" startIcon={<ArrowBack />} sx={{ mb: 1 }}>
              Voltar
            </Button>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={statusLabel[status] || listing.status}
                color={status === 'active' ? 'success' : 'default'}
              />
              <Typography className="muted">
                Mercado Livre - {listing.externalId}
                {listing.lastSyncedAt
                  ? ` - Ultima sincronizacao ${new Date(listing.lastSyncedAt).toLocaleString('pt-BR')}`
                  : ''}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={loadingAction === 'sync' ? <CircularProgress size={16} /> : <Sync />}
              disabled={isBusy}
              onClick={() =>
                run(
                  'sync',
                  () => api.post(`/listings/${id}/sync`),
                  'Anuncio sincronizado com sucesso.',
                )
              }
            >
              Sincronizar
            </Button>
            {listing.permalink && (
              <Button
                variant="contained"
                href={listing.permalink}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNew />}
              >
                Abrir no Mercado Livre
              </Button>
            )}
            <IconButton disabled={isBusy} onClick={(event) => setMenuAnchor(event.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Stack>
        </Stack>

        {listing.alerts?.length > 0 && (
          <Stack spacing={1} mb={2}>
            {listing.alerts.map((alert: any) => (
              <Alert key={alert.message} severity={alert.severity} icon={<WarningAmber />}>
                {alert.message}
              </Alert>
            ))}
          </Stack>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: '#fff',
                        p: 2,
                      }}
                    >
                      {imageUrl ? (
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={listing.title}
                          onError={() => setImageFailed(true)}
                          sx={{
                            width: '100%',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: { xs: 460, md: 420 },
                            objectFit: 'contain',
                            display: 'block',
                            mx: 'auto',
                          }}
                        />
                      ) : (
                        <Typography className="muted">Sem imagem</Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} mt={1} justifyContent="center">
                      <Tooltip title="Ver imagem">
                        <span>
                          <IconButton
                            aria-label="Ver imagem"
                            disabled={!imageUrl}
                            onClick={() => setImageOpen(true)}
                            size="small"
                          >
                            <ImageSearch fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography className="muted" variant="caption">
                          Titulo
                        </Typography>
                        <Typography fontWeight={600}>{listing.title}</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Info label="Marketplace" value="Mercado Livre" />
                        <Info label="ID" value={listing.externalId} />
                        <Info
                          label="SKU"
                          value={listing.externalSku || listing.product?.sku || '-'}
                        />
                        <Info label="Condicao" value={condition} />
                        <Info label="Tipo" value={raw.listing_type_id || 'Nao informado'} />
                        <Info label="Categoria" value={raw.category_id || 'Nao informado'} />
                      </Grid>
                      <Divider />
                      <Grid container spacing={2}>
                        <Metric
                          label="Preco"
                          value={money(Number(listing.price))}
                          info="Preco atual do anuncio sincronizado do marketplace."
                        />
                        <Metric label="Estoque" value={`${listing.availableQuantity} unidades`} />
                        <Metric label="Vendidos" value={listing.soldQuantity} />
                      </Grid>
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setEditOpen(true)}
                      >
                        Editar anuncio
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography fontWeight={600} mb={2}>
                  Performance
                </Typography>
                <Grid container spacing={1.5}>
                  <PerformanceCard
                    label="Vendas 7 dias"
                    value={listing.performance?.last7Days?.units || 0}
                  />
                  <PerformanceCard
                    label="Faturamento 30 dias"
                    value={money(listing.performance?.last30Days?.revenue || 0)}
                    info="Soma do valor bruto vendido por este anuncio nos ultimos 30 dias."
                  />
                  <PerformanceCard
                    label="Lucro 30 dias"
                    value={money(listing.performance?.last30Days?.profit || 0)}
                    info="Receita dos ultimos 30 dias menos taxas, frete, descontos, custo dos produtos e impostos estimados."
                  />
                  <PerformanceCard
                    label="Margem 30 dias"
                    value={typeof margin30Days === 'number' ? `${margin30Days.toFixed(1)}%` : '--'}
                    info="Lucro estimado dos ultimos 30 dias dividido pelo faturamento do mesmo periodo."
                  />
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography fontWeight={600} mb={2}>
                  Historico de acoes
                </Typography>
                {!listing.actionLogs?.length ? (
                  <Typography className="muted">Nenhuma acao registrada ainda.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {listing.actionLogs.map((log: any) => (
                      <Box key={log.id} sx={{ display: 'flex', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: log.status === 'SUCCESS' ? 'success.main' : 'error.main',
                            mt: 0.8,
                            flex: '0 0 auto',
                          }}
                        />
                        <Box>
                          <Typography fontWeight={600}>{formatAction(log)}</Typography>
                          <Typography className="muted" variant="body2">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                            {log.errorMessage ? ` - ${log.errorMessage}` : ''}
                          </Typography>
                          <Typography variant="body2">{formatChange(log)}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem disabled={isBusy} onClick={() => openConfirmAction('pause')}>
            <PauseCircle fontSize="small" style={{ marginRight: 8 }} />
            Pausar anuncio
          </MenuItem>
          <MenuItem disabled={isBusy} onClick={() => openConfirmAction('activate')}>
            <PlayCircle fontSize="small" style={{ marginRight: 8 }} />
            Reativar anuncio
          </MenuItem>
          <MenuItem
            disabled={isBusy}
            onClick={() => openConfirmAction('close')}
            sx={{ color: 'error.main' }}
          >
            <WarningAmber fontSize="small" style={{ marginRight: 8 }} />
            Encerrar anuncio
          </MenuItem>
        </Menu>

        <Dialog
          open={editOpen}
          onClose={() => {
            if (loadingAction !== 'edit') setEditOpen(false);
          }}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Editar anuncio</DialogTitle>
          <DialogContent>
            <Stack spacing={3} mt={1}>
              <Box>
                <Typography fontWeight={600} mb={1}>
                  Dados de venda
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Titulo"
                      value={form.title}
                      helperText="Se o Mercado Livre nao permitir alterar este campo, a alteracao sera recusada sem mudar o banco local."
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Novo preco"
                      value={form.price}
                      inputMode="decimal"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      onBlur={() =>
                        setForm({
                          ...form,
                          price: formatBrazilianCurrencyInput(
                            parseBrazilianCurrencyInput(form.price),
                          ),
                        })
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          price: formatBrazilianCurrencyFromDigits(event.target.value),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Custo do produto"
                      value={form.cost}
                      inputMode="decimal"
                      disabled={!listing.product?.id}
                      helperText={
                        listing.product?.id
                          ? 'Usado para calcular lucro e margem.'
                          : 'Vincule um produto para informar o custo.'
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      onBlur={() =>
                        setForm({
                          ...form,
                          cost: form.cost
                            ? formatBrazilianCurrencyInput(parseBrazilianCurrencyInput(form.cost))
                            : '',
                        })
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          cost: formatBrazilianCurrencyFromDigits(event.target.value),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Novo estoque"
                      type="number"
                      value={form.quantity}
                      inputProps={{ min: 0, step: 1 }}
                      onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography fontWeight={600} mb={1}>
                  Midia
                </Typography>
                <Stack spacing={1.5}>
                  {form.pictureUrls.map((url, index) => {
                    const normalizedUrl = normalizeMercadoLivreImageUrl(url);

                    return (
                      <Stack
                        key={index}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                      >
                        <Box
                          onClick={() => {
                            if (!normalizedUrl) return;
                            setPreviewImageUrl(normalizedUrl);
                            setImageOpen(true);
                          }}
                          sx={{
                            width: { xs: '100%', sm: 72 },
                            height: 72,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            overflow: 'hidden',
                            flex: '0 0 auto',
                            cursor: normalizedUrl ? 'zoom-in' : 'default',
                          }}
                        >
                          {normalizedUrl ? (
                            <Box
                              component="img"
                              src={normalizedUrl}
                              alt={`Imagem ${index + 1}`}
                              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <PhotoCamera fontSize="small" color="disabled" />
                          )}
                        </Box>
                        <TextField
                          fullWidth
                          label={index === 0 ? 'Imagem principal' : `Imagem ${index + 1}`}
                          value={url}
                          helperText={
                            index === 0
                              ? 'A primeira imagem vira a principal do anuncio.'
                              : 'URL publica da imagem.'
                          }
                          onChange={(event) => {
                            const pictureUrls = [...form.pictureUrls];
                            pictureUrls[index] = event.target.value;
                            setForm({ ...form, pictureUrls });
                          }}
                        />
                        <Tooltip title="Ver imagem">
                          <span>
                            <IconButton
                              aria-label="Ver imagem"
                              disabled={!normalizedUrl}
                              onClick={() => {
                                setPreviewImageUrl(normalizedUrl);
                                setImageOpen(true);
                              }}
                            >
                              <ImageSearch />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Remover imagem">
                          <span>
                            <IconButton
                              aria-label="Remover imagem"
                              disabled={form.pictureUrls.length === 1}
                              onClick={() =>
                                setForm({
                                  ...form,
                                  pictureUrls: form.pictureUrls.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                })
                              }
                            >
                              <DeleteOutline />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    );
                  })}
                  <Button
                    startIcon={<Add />}
                    onClick={() => setForm({ ...form, pictureUrls: [...form.pictureUrls, ''] })}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Adicionar imagem
                  </Button>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography fontWeight={600} mb={1}>
                  Publicacao
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo de anuncio"
                      value={form.listingTypeId}
                      helperText={
                        loadingListingTypes
                          ? 'Buscando opcoes no Mercado Livre...'
                          : 'O Mercado Livre informa que o tipo de publicacao so pode ser alterado uma vez.'
                      }
                      onChange={(event) => setForm({ ...form, listingTypeId: event.target.value })}
                    >
                      {listingTypeSelectOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {formatListingTypeLabel(option)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Categoria"
                      value={form.categoryId}
                      helperText={
                        loadingCategories
                          ? 'Buscando categorias sugeridas no Mercado Livre...'
                          : 'Categorias sugeridas pelo Mercado Livre com base no titulo do anuncio.'
                      }
                      onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                    >
                      {categorySelectOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {formatCategoryLabel(option)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={loadingAction === 'edit'} onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={loadingAction === 'edit' ? <CircularProgress size={16} /> : undefined}
              disabled={loadingAction === 'edit'}
              onClick={saveEdit}
            >
              {loadingAction === 'edit' ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(confirmAction)} onClose={closeConfirmAction} fullWidth maxWidth="xs">
          {confirmAction && (
            <>
              <DialogTitle>{confirmCopy[confirmAction].title}</DialogTitle>
              <DialogContent>
                <Typography>{confirmCopy[confirmAction].text}</Typography>
              </DialogContent>
              <DialogActions>
                <Button disabled={isConfirmActionLoading} onClick={closeConfirmAction}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color={confirmAction === 'close' ? 'error' : 'primary'}
                  startIcon={isConfirmActionLoading ? <CircularProgress size={16} /> : undefined}
                  disabled={isBusy}
                  onClick={() => {
                    const action = confirmAction;
                    const endpoint =
                      action === 'pause' ? 'pause' : action === 'activate' ? 'activate' : 'close';
                    run(
                      action,
                      () => api.post(`/listings/${id}/${endpoint}`),
                      action === 'pause'
                        ? 'Anuncio pausado com sucesso.'
                        : action === 'activate'
                          ? 'Anuncio reativado com sucesso.'
                          : 'Anuncio encerrado com sucesso.',
                    );
                  }}
                >
                  {isConfirmActionLoading
                    ? confirmCopy[confirmAction].loading
                    : confirmCopy[confirmAction].action}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog
          open={imageOpen}
          onClose={() => {
            setImageOpen(false);
            setPreviewImageUrl('');
          }}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Imagem do anuncio</DialogTitle>
          <DialogContent>
            {modalImageUrl ? (
              <Box
                component="img"
                src={modalImageUrl}
                alt={listing.title}
                sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', bgcolor: '#f3f5f8' }}
              />
            ) : (
              <Typography className="muted">Este anuncio nao possui imagem disponivel.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setImageOpen(false);
                setPreviewImageUrl('');
              }}
            >
              Fechar
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(snackbar)}
          autoHideDuration={5000}
          message={snackbar}
          onClose={() => setSnackbar('')}
        />
      </div>
    </Shell>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <Grid item xs={6}>
      <Typography className="muted" variant="caption">
        {label}
      </Typography>
      <Typography fontWeight={600}>{value || '-'}</Typography>
    </Grid>
  );
}

function Metric({ label, value, info }: { label: string; value: any; info?: string }) {
  return (
    <Grid item xs={4}>
      <Typography className="muted" variant="caption" component="div">
        {info ? <LabelWithInfo label={label} info={info} /> : label}
      </Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Grid>
  );
}

function PerformanceCard({ label, value, info }: { label: string; value: any; info?: string }) {
  return (
    <Grid item xs={6}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, minHeight: 86 }}>
        <Typography className="muted" variant="caption" component="div">
          {info ? <LabelWithInfo label={label} info={info} /> : label}
        </Typography>
        <Typography fontWeight={600} fontSize={22}>
          {value}
        </Typography>
      </Box>
    </Grid>
  );
}

function formatAction(log: any) {
  const labels: Record<string, string> = {
    PRICE_UPDATED: 'Preco alterado',
    STOCK_UPDATED: 'Estoque alterado',
    TITLE_UPDATED: 'Titulo alterado',
    PICTURES_UPDATED: 'Imagens atualizadas',
    LISTING_TYPE_UPDATED: 'Tipo de anuncio alterado',
    CATEGORY_UPDATED: 'Categoria alterada',
    PAUSED: 'Anuncio pausado',
    ACTIVATED: 'Anuncio reativado',
    CLOSED: 'Anuncio encerrado',
    SYNCED: 'Anuncio sincronizado',
  };
  return labels[log.action] || log.action;
}

function formatChange(log: any) {
  const oldValue = log.oldValue || {};
  const newValue = log.newValue || {};

  if (log.action === 'PRICE_UPDATED') {
    return `${formatHistoryMoney(oldValue.price)} -> ${formatHistoryMoney(newValue.price)}`;
  }
  if (log.action === 'STOCK_UPDATED') {
    return `${oldValue.quantity ?? '--'} -> ${newValue.available_quantity}`;
  }
  if (log.action === 'TITLE_UPDATED') return `${oldValue.title || '--'} -> ${newValue.title}`;
  if (log.action === 'PICTURES_UPDATED') {
    return `${oldValue.pictures?.length || 0} imagem(ns) -> ${newValue.pictures?.length || 0} imagem(ns)`;
  }
  if (log.action === 'LISTING_TYPE_UPDATED') {
    return `${oldValue.listingTypeId || '--'} -> ${newValue.listing_type_id}`;
  }
  if (log.action === 'CATEGORY_UPDATED') {
    return `${oldValue.categoryId || '--'} -> ${newValue.category_id}`;
  }
  if (newValue.status) return `Status: ${oldValue.status || '--'} -> ${newValue.status}`;
  return '';
}

function normalizeMercadoLivreImageUrl(value?: string) {
  if (!value) return '';
  return value.replace('http://', 'https://').replace(/-I(\.[a-zA-Z0-9]+)$/i, '-O$1');
}

function formatListingTypeLabel(option: ListingTypeOption) {
  const name =
    option.name && option.name !== option.id ? `${option.name} (${option.id})` : option.id;
  return option.current ? `${name} - atual` : name;
}

function formatCategoryLabel(option: CategoryOption) {
  const name =
    option.name && option.name !== option.id ? `${option.name} (${option.id})` : option.id;
  return option.current ? `${name} - atual` : name;
}

function formatHistoryMoney(value: any) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '--';
  return money(numberValue);
}

function sanitizeBrazilianCurrencyInput(value: string) {
  return value.replace(/[^\d,.]/g, '');
}

function formatBrazilianCurrencyFromDigits(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '0,00';
  return formatBrazilianCurrencyInput(Number(digits) / 100);
}

function parseBrazilianCurrencyInput(value: string) {
  const cleanValue = sanitizeBrazilianCurrencyInput(value);
  if (!cleanValue) return 0;
  return Number(cleanValue.replace(/\./g, '').replace(',', '.'));
}

function formatBrazilianCurrencyInput(value: number | string) {
  const numberValue = typeof value === 'number' ? value : Number(value || 0);
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
