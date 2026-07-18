import {
  Box,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  ACTION_LABELS,
  MODULES,
  PERMISSION_ACTIONS,
  emptyModulePermission,
  type ModulePermission,
  type PermissionAction,
  type PermissionsMatrix,
} from '../../constants/permissions';

interface PermissionsEditorProps {
  value: PermissionsMatrix;
  onChange: (matrix: PermissionsMatrix) => void;
}

/**
 * Éditeur de permissions (profil « Personnalisé »).
 * La colonne « Voir » active le module ; les autres actions ne sont éditables
 * que si « Voir » est coché. « Valider » est désactivé pour les modules sans validation.
 */
export function PermissionsEditor({ value, onChange }: PermissionsEditorProps) {
  const handleChange = (moduleKey: string, action: PermissionAction, checked: boolean) => {
    const current = value[moduleKey] ?? emptyModulePermission();
    let next: ModulePermission;
    if (action === 'voir') {
      next = checked ? { ...current, voir: true } : emptyModulePermission();
    } else {
      next = { ...current, [action]: checked };
      if (checked) next.voir = true;
    }
    onChange({ ...value, [moduleKey]: next });
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Permissions par module
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
              {PERMISSION_ACTIONS.map((action) => (
                <TableCell key={action} align="center" sx={{ fontWeight: 600 }}>
                  {ACTION_LABELS[action]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {MODULES.map((mod) => {
              const perm = value[mod.key] ?? emptyModulePermission();
              return (
                <TableRow key={mod.key} hover>
                  <TableCell>{mod.label}</TableCell>
                  {PERMISSION_ACTIONS.map((action) => {
                    const isVoir = action === 'voir';
                    const notSupported = action === 'valider' && !mod.valider;
                    const disabled = notSupported || (!isVoir && !perm.voir);
                    return (
                      <TableCell key={action} align="center" padding="checkbox">
                        {notSupported ? (
                          <Box component="span" sx={{ color: 'text.disabled' }}>
                            —
                          </Box>
                        ) : (
                          <Checkbox
                            size="small"
                            checked={Boolean(perm[action])}
                            disabled={disabled}
                            onChange={(e) => handleChange(mod.key, action, e.target.checked)}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
