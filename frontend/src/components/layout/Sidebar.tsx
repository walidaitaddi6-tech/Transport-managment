import { useState, type ReactNode } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import RouteIcon from '@mui/icons-material/Route';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';

interface NavLeaf {
  moduleKey: string;
  label: string;
  to: string;
  icon: ReactNode;
}

interface NavGroup {
  id: string;
  label: string;
  icon: ReactNode;
  to: string;
  /** Le groupe est visible si au moins un enfant est autorisé. */
  children: NavLeaf[];
}

type NavEntry = { kind: 'leaf'; leaf: NavLeaf } | { kind: 'group'; group: NavGroup };

/** Structure complète de navigation (les sous-menus sont regroupés). */
const NAV: NavEntry[] = [
  { kind: 'leaf', leaf: { moduleKey: 'dashboard', label: 'Tableau de bord', to: '/', icon: <DashboardIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'utilisateurs', label: 'Utilisateurs', to: '/users', icon: <ManageAccountsIcon /> } },
  {
    kind: 'group',
    group: {
      id: 'vehicules',
      label: 'Véhicules',
      icon: <LocalShippingIcon />,
      to: '/vehicules',
      children: [
        { moduleKey: 'vehicules', label: 'Liste des véhicules', to: '/vehicules/liste', icon: <DescriptionIcon /> },
        { moduleKey: 'documents_vehicules', label: 'Documents véhicules', to: '/vehicules/documents', icon: <DescriptionIcon /> },
      ],
    },
  },
  { kind: 'leaf', leaf: { moduleKey: 'conducteurs', label: 'Conducteurs', to: '/conducteurs', icon: <AssignmentIndIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'voyages', label: 'Voyages', to: '/voyages', icon: <RouteIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'depenses_vehicules', label: 'Charges véhicules', to: '/charges-vehicules', icon: <BuildIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'depenses_administratives', label: 'Charges administratives', to: '/charges-administratives', icon: <ReceiptLongIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'clients', label: 'Clients', to: '/clients', icon: <PeopleIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'creances_clients', label: 'Créances clients', to: '/creances', icon: <RequestQuoteIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'paiements_clients', label: 'Paiements clients', to: '/paiements-clients', icon: <PaymentsIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'factures', label: 'Factures', to: '/factures', icon: <ReceiptIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'fournisseurs', label: 'Fournisseurs', to: '/fournisseurs', icon: <StorefrontIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'dettes_fournisseurs', label: 'Dettes fournisseurs', to: '/dettes-fournisseurs', icon: <MoneyOffIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'paiements_fournisseurs', label: 'Paiements fournisseurs', to: '/paiements-fournisseurs', icon: <PaidIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'bons_carburant', label: 'Consommation gasoil', to: '/consommation-gasoil', icon: <LocalGasStationIcon /> } },
  { kind: 'leaf', leaf: { moduleKey: 'gestion_paiements', label: 'Gestion paiements', to: '/gestion-paiements', icon: <AccountBalanceWalletIcon /> } },
];

const leafStyles = {
  borderRadius: 2,
  mb: 0.5,
  '&.active': {
    bgcolor: 'primary.main',
    color: '#fff',
    '& .MuiListItemIcon-root': { color: '#fff' },
  },
} as const;

export function Sidebar() {
  const { can } = useAuth();
  const location = useLocation();

  // État d'ouverture des groupes (persistant tant que le layout reste monté ;
  // initialisé selon la route courante après un rechargement).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    vehicules: location.pathname.startsWith('/vehicules'),
  });

  const toggle = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <LocalShippingIcon color="primary" />
        <Typography variant="h6" color="primary.main" noWrap>
          Transport
        </Typography>
      </Toolbar>
      <List sx={{ px: 1, overflowY: 'auto' }}>
        {NAV.map((entry) => {
          if (entry.kind === 'leaf') {
            const { leaf } = entry;
            if (!can(leaf.moduleKey, 'voir')) return null;
            return (
              <ListItemButton
                key={leaf.to}
                component={NavLink}
                to={leaf.to}
                end={leaf.to === '/'}
                sx={leafStyles}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{leaf.icon}</ListItemIcon>
                <ListItemText primary={leaf.label} />
              </ListItemButton>
            );
          }

          const { group } = entry;
          const visibleChildren = group.children.filter((c) => can(c.moduleKey, 'voir'));
          if (visibleChildren.length === 0) return null;
          const open = Boolean(openGroups[group.id]);

          return (
            <Box key={group.id}>
              <ListItemButton component={NavLink} to={group.to} end sx={leafStyles}>
                <ListItemIcon sx={{ minWidth: 40 }}>{group.icon}</ListItemIcon>
                <ListItemText primary={group.label} />
                <IconButton
                  size="small"
                  edge="end"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(group.id);
                  }}
                  sx={{ color: 'inherit' }}
                >
                  {open ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                </IconButton>
              </ListItemButton>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ pl: 2 }}>
                  {visibleChildren.map((child) => (
                    <ListItemButton
                      key={child.to}
                      component={NavLink}
                      to={child.to}
                      sx={leafStyles}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
