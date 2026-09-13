'use client';

import { IconButton, Stack, Tooltip } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

export function InfoHint({ title }: { title: string }) {
  return (
    <Tooltip title={title} arrow enterTouchDelay={0}>
      <IconButton
        aria-label="Como este valor e calculado"
        size="small"
        sx={{ color: 'text.disabled', ml: 0.4, p: 0.25, verticalAlign: 'middle' }}
      >
        <InfoOutlined sx={{ fontSize: 15 }} />
      </IconButton>
    </Tooltip>
  );
}

export function LabelWithInfo({ label, info }: { label: string; info: string }) {
  return (
    <Stack direction="row" spacing={0.4} alignItems="center" component="span">
      <span>{label}</span>
      <InfoHint title={info} />
    </Stack>
  );
}
