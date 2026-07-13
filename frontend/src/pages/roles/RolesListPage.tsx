import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { RoleFormDialog } from './RoleFormDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  useCreateRole,
  useDeleteRole,
  useRolesQuery,
  useUpdateRole,
} from '../../features/roles/useRoles';
import type { Role, RolePayload } from '../../features/roles/types';

export function RolesListPage() {
  const [page, setPage] = useState(0); // 0-based (MUI)
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  // Débounce de la recherche.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: search || undefined,
      sortBy: 'id' as const,
      sortOrder: 'asc' as const,
    }),
    [page, rowsPerPage, search],
  );

  const { data, isLoading, isError, isFetching } = useRolesQuery(params);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (role: Role) => {
    setEditing(role);
    setFormOpen(true);
  };

  const handleSubmit = (payload: RolePayload) => {
    if (editing) {
      updateRole.mutate(
        { id: editing.id, payload },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createRole.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteRole.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Rôles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau rôle
        </Button>
      </Stack>

      <Paper>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Rechercher un rôle…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {(isLoading || isFetching) && <LinearProgress />}

        {isError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            Impossible de charger les rôles.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={80}>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right" width={120}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Aucun rôle trouvé.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((role) => (
                    <TableRow key={role.id} hover>
                      <TableCell>{role.id}</TableCell>
                      <TableCell>{role.nom}</TableCell>
                      <TableCell>{role.description ?? '—'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => openEdit(role)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => setToDelete(role)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes par page"
        />
      </Paper>

      <RoleFormDialog
        open={formOpen}
        role={editing}
        loading={createRole.isPending || updateRole.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer le rôle"
        message={`Confirmer la suppression du rôle « ${toDelete?.nom} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={deleteRole.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
