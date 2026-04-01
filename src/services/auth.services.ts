import { ApiLogin, type ApiLoginResponse } from '@siemens/simatic-s7-webserver-api';
import { createRequestConfig, DEFAULT_PLC_ADDRESS } from './request-config.services';

export const PLC_ADDRESS_KEY = 'plcAddress';
const TOKEN_KEY = 'authToken';

export function getPlcAddress(): string {
    return sessionStorage.getItem(PLC_ADDRESS_KEY) || DEFAULT_PLC_ADDRESS;
}

const DEFAULT_USERNAME = 'Admin';
const DEFAULT_PASSWORD = '12345678';

let authToken: string | null = sessionStorage.getItem(TOKEN_KEY);
let refreshTimer: number | null = null;

export async function loginToPLC(
    plcAddress: string,
    username: string = DEFAULT_USERNAME,
    password: string = DEFAULT_PASSWORD
): Promise<boolean> {
    sessionStorage.setItem(PLC_ADDRESS_KEY, plcAddress);

    const config = createRequestConfig();
    const response = await new ApiLogin(config, username, password, true).execute() as ApiLoginResponse | null;

    const token = typeof response?.result === 'string' ? response.result : null;

    if (!response || !token || response.error) {
        console.warn('[PLC] Login failed:', {
            hasResponse: !!response,
            hasToken: !!token,
            error: response?.error
        });
        return false;
    }

    authToken = token;
    sessionStorage.setItem(TOKEN_KEY, token);
    return true;
}

export async function silentLoginAtStartup(plcAddress: string): Promise<boolean> {
    return loginToPLC(plcAddress, DEFAULT_USERNAME, DEFAULT_PASSWORD);
}

export function getAuthToken(): string {
    const token = authToken || sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
        throw new Error('No auth token available');
    }
    return token;
}

export function startPeriodicLogin(plcAddress: string): void {
    if (refreshTimer !== null) {
        clearInterval(refreshTimer);
    }

    refreshTimer = window.setInterval(async () => {
        try {
            const ok = await loginToPLC(plcAddress, DEFAULT_USERNAME, DEFAULT_PASSWORD);
            if (!ok) {
                console.warn('Silent re-login failed');
            }
        } catch (err) {
            console.warn('Silent re-login error', err);
        }
    }, 60000);
}

export function logout(): void {
    authToken = null;

    if (refreshTimer !== null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }

    sessionStorage.removeItem(TOKEN_KEY);
}
