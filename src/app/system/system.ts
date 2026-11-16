import { Injectable } from '@angular/core';

import {
  API_BASE_URL,
  SYSTEM_MODULES,
  API_ENDPOINTS
} from './system.config';

@Injectable({
  providedIn: 'root'
})
export class SystemService {

  readonly apiBaseUrl = API_BASE_URL;

  readonly modules = SYSTEM_MODULES;

  readonly endpoints = API_ENDPOINTS;

  getModule(moduleName: string) {
    return this.modules[moduleName];
  }

  getApiUrl(endpoint: string): string {
    return `${this.apiBaseUrl}/api${endpoint}`;
  }

}
