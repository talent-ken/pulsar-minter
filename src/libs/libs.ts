import { toast } from 'react-toastify';

export const showNotification = (
  context: string,
  type?: 'success' | 'info' | 'warning' | 'error'
) =>
  type
    ? toast[type](context, {
        style: { fontFamily: "'Roboto', 'sans-serif'" }
      })
    : toast(context, {
        style: { fontFamily: "'Roboto', 'sans-serif'" }
      });
