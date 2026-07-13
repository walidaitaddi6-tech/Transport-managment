import { Box, CircularProgress, Typography } from '@mui/material';

/** Loader plein écran (restauration de session, chargements bloquants). */
export function FullScreenLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}
