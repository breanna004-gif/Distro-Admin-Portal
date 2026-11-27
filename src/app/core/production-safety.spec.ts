import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../environments/environment', () => ({
  environment: {
    production: true,
    apiUrl: 'https://example.test',
    enableDemoDispatch: false,
  },
}));

import { environment } from '../../environments/environment';
import { assertProductionSafeConfig } from './production-safety';

describe('assertProductionSafeConfig', () => {
  afterEach(() => {
    environment.production = true;
    environment.enableDemoDispatch = false;
  });

  it('allows demo dispatch outside production', () => {
    environment.production = false;
    environment.enableDemoDispatch = true;
    expect(() => assertProductionSafeConfig()).not.toThrow();
  });

  it('refuses demo dispatch in production builds', () => {
    environment.production = true;
    environment.enableDemoDispatch = true;
    expect(() => assertProductionSafeConfig()).toThrow(/enableDemoDispatch/);
  });

  it('passes when production demo dispatch is false', () => {
    environment.production = true;
    environment.enableDemoDispatch = false;
    expect(() => assertProductionSafeConfig()).not.toThrow();
  });
});
