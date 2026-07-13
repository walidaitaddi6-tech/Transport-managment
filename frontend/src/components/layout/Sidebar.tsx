import {
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/', icon: <DashboardIcon /> },
  { label: 'Utilisateurs', to: '/users', icon: <ManageAccountsIcon /> },
  { label: 'Rôles', to: '/roles', icon: <BadgeIcon /> },
  { label: 'Clients', to: '/clients', icon: <PeopleIcon />, disabled: true },
];

const activeStyles = {
  borderRadius: 2,
  mb: 0.5,
  '&.active': {
    bgcolor: 'primary.main',
    color: '#fff',
    '& .MuiListItemIcon-root': { color: '#fff' },
  },
} as const;

export function Sidebar() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <LocalShippingIcon color="primary" />
        <Typography variant="h6" color="primary.main" noWrap>
          Transport
        </Typography>
      </Toolbar>
      <List sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) =>
          item.disabled ? (
            <ListItemButton key={item.to} disabled sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
              <Chip size="small" label="à venir" variant="outlined" />
            </ListItemButton>
          ) : (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={activeStyles}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ),
        )}
      </List>
    </Box>
  );
}
