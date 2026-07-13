import { Box, Button, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';

/** Page 403 — accès refusé (permissions insuffisantes). */
export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <BlockIcon color="error" sx={{ fontSize: 72 }} />
      <Typography variant="h4">403 — Accès refusé</Typography>
      <Typography color="text.secondary">
        Vous n’avez pas les permissions nécessaires pour accéder à cette page.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Retour au tableau de bord
      </Button>
    </Box>
  );
}
