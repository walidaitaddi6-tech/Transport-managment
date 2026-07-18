import type { ReactNode } from 'react';
import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: Crumb[];
  action?: ReactNode;
}

/** En-tête de page réutilisable : fil d'Ariane + titre + action optionnelle. */
export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        {breadcrumbs.map((crumb, index) =>
          crumb.to ? (
            <Link
              key={index}
              component={RouterLink}
              to={crumb.to}
              underline="hover"
              color="inherit"
            >
              {crumb.label}
            </Link>
          ) : (
            <Typography key={index} color="text.primary">
              {crumb.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        <Typography variant="h4">{title}</Typography>
        {action}
      </Stack>
    </Box>
  );
}
