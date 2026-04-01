import { RequestConfig } from '@siemens/simatic-s7-webserver-api';

export const DEFAULT_PLC_ADDRESS = '192.168.0.10';

/**
 * In dev mode, requests go through the Vite proxy to avoid CORS when the app
 * runs on localhost and the PLC is at a different origin. The proxy forwards
 * /api to the PLC (see vite.config.ts).
 */
function getEffectiveAddress(): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.host;
  }
  return sessionStorage.getItem('plcAddress') || DEFAULT_PLC_ADDRESS;
}

export function createRequestConfig(): RequestConfig {
  const config = new RequestConfig();
  const address = getEffectiveAddress();
  const useProxy = import.meta.env.DEV && typeof window !== 'undefined';

  config.protocol = useProxy ? (window.location.protocol === 'https:' ? 'https' : 'http') : 'https';
  config.verifyTls = false;
  config.address = address;
  return config;
}

export class RequestConfigService {
  create(): RequestConfig {
    return createRequestConfig();
  }

  createConfig(protocol: string, verifyTls: boolean): RequestConfig {
    const config = new RequestConfig();

    config.protocol = protocol;
    config.verifyTls = verifyTls;
    return config;
  }

  getDefaultAddress(): string {
    return sessionStorage.getItem('plcAddress') || '';
  }
}

