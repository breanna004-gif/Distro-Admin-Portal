import { environment } from '../../environments/environment';

/**
 * Production builds must never ship with demo-dispatch enabled.
 * Throws during bootstrap so a misconfigured build fails closed.
 */
export function assertProductionSafeConfig(): void {
  if (!environment.production) {
    return;
  }
  if (environment.enableDemoDispatch) {
    throw new Error('environment.enableDemoDispatch must be false in production builds.');
  }
}
