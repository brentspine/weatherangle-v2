import { toasts } from 'brents-toasts';

// Mirrors the semantic palette in src/styles.scss (:root) so toast accent bars
// read as the same colors used by .card-header/.alert-* elsewhere in the app,
// rather than the library's own unrelated defaults. Since brents-toasts@2.5.0,
// `color` is purely presentational - role/aria-live come from `severity`
// (ToastOptions.severity) instead, so these are safe to override freely.
export const AppToastColor = {
  INFO: '#2667ff', // matches --color-card-header-blue
  SUCCESS: '#198754', // matches --color-success-background/-text pairing
  WARNING: '#ffc107', // matches --color-warning-background/-text pairing
  ERROR: '#dd1b16', // matches --color-accent
} as const;

export function configureAppToasts(): void {
  toasts.configure({
    colors: AppToastColor,
    theme: {
      // Same floating-panel treatment as .account-dropdown in header.scss.
      background: 'rgba(10, 8, 10, 0.94)',
      text: '#ffffff',
      detailsBackground: 'rgba(255, 255, 255, 0.08)',
      actionColor: '#dd1b16',
      // Override the library's auto-contrast pick (which goes dark against
      // our lighter accent colors, e.g. WARNING) - white reads fine against
      // every color in our palette and stays consistent across severities.
      closeIcon: '#ffffff',
    },
  });
}
