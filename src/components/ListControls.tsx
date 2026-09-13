'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { FilterAltOff, Search } from '@mui/icons-material';

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterField = {
  name: string;
  label: string;
  type: 'search' | 'select' | 'date';
  placeholder?: string;
  options?: FilterOption[];
  minWidth?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ListFiltersProps = {
  fields: FilterField[];
  values: Record<string, string>;
  quickFilters?: FilterOption[];
  periodPresets?: FilterOption[];
  sortOptions?: FilterOption[];
  loading?: boolean;
  hasActiveFilters: boolean;
  onChange: (name: string, value: string) => void;
  onManyChange: (values: Record<string, string>) => void;
  onClear: () => void;
};

const emptyDefaults: Record<string, string> = {};

export function useListQuery(defaults: Record<string, string> = emptyDefaults) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultKey = JSON.stringify(defaults);

  const values = useMemo(() => {
    const next = { ...defaults };
    searchParams.forEach((value, key) => {
      next[key] = value;
    });
    return next;
  }, [defaultKey, searchParams]);

  const setMany = (updates: Record<string, string>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'ALL') params.delete(key);
      else params.set(key, value);
    });
    if (resetPage) params.delete('page');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const setValue = (name: string, value: string) => {
    setMany({ [name]: value }, name !== 'page');
  };

  const clear = () => router.replace(pathname);

  return { values, setValue, setMany, clear };
}

export function ListFilters({
  fields,
  values,
  quickFilters,
  periodPresets,
  sortOptions,
  loading,
  hasActiveFilters,
  onChange,
  onManyChange,
  onClear,
}: ListFiltersProps) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {quickFilters?.length ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={values.quick || 'all'}
            onChange={(_, value) => {
              if (value) onChange('quick', value === 'all' ? '' : value);
            }}
            sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}
          >
            {quickFilters.map((filter) => (
              <ToggleButton key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : null}

        {periodPresets?.length ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={values.period || ''}
            onChange={(_, value) => {
              if (!value) return;
              onManyChange({ ...periodPreset(value), period: value });
            }}
            sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}
          >
            {periodPresets.map((preset) => (
              <ToggleButton key={preset.value} value={preset.value}>
                {preset.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems="stretch">
          {fields.map((field) =>
            field.type === 'search' ? (
              <DebouncedTextField
                key={field.name}
                field={field}
                value={values[field.name] || ''}
                onChange={onChange}
              />
            ) : (
              <TextField
                key={field.name}
                type={field.type === 'date' ? 'date' : undefined}
                select={field.type === 'select'}
                size="small"
                label={field.label}
                value={values[field.name] || ''}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                onChange={(event) => onChange(field.name, event.target.value)}
                sx={{
                  minWidth: { xs: '100%', md: field.minWidth || 150 },
                  flex: field.type === 'date' ? '0 0 auto' : 'initial',
                }}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ),
          )}

          {sortOptions?.length ? (
            <>
              <TextField
                select
                size="small"
                label="Ordenar por"
                value={values.sortBy || ''}
                onChange={(event) => onChange('sortBy', event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 160 } }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Direcao"
                value={values.sortOrder || 'desc'}
                onChange={(event) => onChange('sortOrder', event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 130 } }}
              >
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </TextField>
            </>
          ) : null}

          <Button
            variant={hasActiveFilters ? 'outlined' : 'text'}
            color={hasActiveFilters ? 'primary' : 'inherit'}
            startIcon={<FilterAltOff />}
            disabled={!hasActiveFilters}
            onClick={onClear}
            sx={{ height: 40, whiteSpace: 'nowrap' }}
          >
            Limpar
          </Button>
          {loading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minWidth: 40 }}>
              <CircularProgress size={18} />
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DebouncedTextField({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (localValue !== value) onChange(field.name, localValue);
    }, 400);
    return () => window.clearTimeout(id);
  }, [field.name, localValue, onChange, value]);

  return (
    <TextField
      size="small"
      label={field.label}
      placeholder={field.placeholder}
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      InputProps={{
        startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} />,
      }}
      sx={{ minWidth: { xs: '100%', md: field.minWidth || 340 }, flex: 1 }}
    />
  );
}

export function ResultsPagination({
  pagination,
  onPageChange,
  position = 'bottom',
}: {
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
  position?: 'top' | 'bottom';
}) {
  if (!pagination || pagination.total <= 0) return null;

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      sx={position === 'top' ? { mb: 2 } : { mt: 2 }}
    >
      <Typography className="muted" variant="body2">
        Mostrando {start}-{end} de {pagination.total} resultados
      </Typography>
      <Pagination
        count={pagination.totalPages}
        page={pagination.page}
        onChange={(_, page) => onPageChange(page)}
        color="primary"
        size="small"
      />
    </Stack>
  );
}

export const periodOptions = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ultimos 7 dias', value: '7d' },
  { label: 'Ultimos 30 dias', value: '30d' },
  { label: 'Este mes', value: 'thisMonth' },
  { label: 'Mes passado', value: 'lastMonth' },
  { label: 'Personalizado', value: 'custom' },
];

export function hasFilters(values: Record<string, string>, ignored: string[] = ['page']) {
  return Object.entries(values).some(
    ([key, value]) => !ignored.includes(key) && Boolean(value) && value !== 'ALL',
  );
}

function periodPreset(value: string) {
  if (value === 'custom') return { dateFrom: '', dateTo: '' };
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (value === '7d') start.setDate(today.getDate() - 6);
  if (value === '30d') start.setDate(today.getDate() - 29);
  if (value === 'thisMonth') start.setDate(1);
  if (value === 'lastMonth') {
    start.setMonth(today.getMonth() - 1, 1);
    end.setDate(0);
  }

  return {
    dateFrom: formatInputDate(start),
    dateTo: formatInputDate(end),
  };
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
