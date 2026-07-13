import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { setEnqueue } from '../../utils/notify';

/** Branche enqueueSnackbar au helper notify (utilisable hors composants). */
export function SnackbarConfigurator() {
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    setEnqueue(enqueueSnackbar);
  }, [enqueueSnackbar]);
  return null;
}
