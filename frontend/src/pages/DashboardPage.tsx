import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useAuth } from '../features/auth/useAuth';

/** Page d'accueil après connexion (placeholder — validera la route protégée). */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Bienvenue, {user?.nom}.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Session
              </Typography>
              <Typography variant="h6">{user?.email}</Typography>
              <Typography variant="body2" color="text.secondary">
                Rôle : {user?.role}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={8}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                À venir
              </Typography>
              <Typography variant="body1">
                Les modules métier (Clients, Véhicules, Voyages, Facturation…) seront ajoutés
                progressivement.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
