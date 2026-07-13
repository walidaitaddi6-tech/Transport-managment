import type { OptionsObject, SnackbarMessage } from 'notistack';

/**
 * Pont vers notistack utilisable depuis n'importe où (y compris hors composants,
 * ex. intercepteurs Axios). La référence enqueueSnackbar est branchée au montage
 * par <SnackbarConfigurator />.
 */
type EnqueueFn = (message: SnackbarMessage, options?: OptionsObject) => void;

let enqueue: EnqueueFn | null = null;

export const setEnqueue = (fn: EnqueueFn): void => {
  enqueue = fn;
};

export const notify = {
  success(message: string): void {
    enqueue?.(message, { variant: 'success' });
  },
  error(message: string): void {
    enqueue?.(message, { variant: 'error' });
  },
  warning(message: string): void {
    enqueue?.(message, { variant: 'warning' });
  },
  info(message: string): void {
    enqueue?.(message, { variant: 'info' });
  },
};
