import { ApiLogin, type ApiLoginResponse } from '@siemens/simatic-s7-webserver-api';
import { createRequestConfig, DEFAULT_PLC_ADDRESS } from './request-config.services';

export const PLC_ADDRESS_KEY = 'plcAddress';
const TOKEN_KEY = 'authToken';

/**
 * Tracks whether the PLC accepted a login or we are running without auth.
 *
 *   'authenticated' — login succeeded; a valid token is present.
 *   'anonymous'     — login failed or PLC has access control disabled;
 *                     requests are sent without a token (empty string).
 *
 * The PLC web server ignores the token field when access control is disabled,
 * so anonymous mode works transparently in that case. When AC is enabled and
 * the token is missing, the PLC returns a permission-denied API error, which
 * surfaces as a normal operation error in the UI.
 */
export type AuthMode = 'anonymous' | 'authenticated';

export function getPlcAddress(): string {
    return sessionStorage.getItem(PLC_ADDRESS_KEY) || DEFAULT_PLC_ADDRESS;
}

const DEFAULT_USERNAME = 'Admin';
const DEFAULT_PASSWORD = '12345678';

let authToken: string | null = sessionStorage.getItem(TOKEN_KEY);
// Restore mode from a previous session if a token is already stored.
let authMode: AuthMode = authToken ? 'authenticated' : 'anonymous';
let refreshTimer: number | null = null;

/** Returns the active auth mode for the current session. */
export function getAuthMode(): AuthMode {
    return authMode;
}

/**
 * Returns the stored auth token, or null if none is available.
 * Does NOT throw — callers must handle the null case explicitly.
 */
export function getAuthToken(): string | null {
    return authToken ?? sessionStorage.getItem(TOKEN_KEY) ?? null;
}

/** True when a valid auth token is present. */
export function hasAuthToken(): boolean {
    return getAuthToken() !== null;
}

/**
 * Attempts to log in to the PLC with the given credentials.
 * Returns true on success, false on failure.
 * Throws only on unexpected errors (e.g. unhandled SDK exceptions).
 */
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
        console.warn('[Auth] Login failed:', {
            hasResponse: !!response,
            hasToken: !!token,
            error: response?.error,
        });
        return false;
    }

    authToken = token;
    authMode = 'authenticated';
    sessionStorage.setItem(TOKEN_KEY, token);
    return true;
}

/**
 * Attempts a silent login at startup.
 *
 * Returns 'authenticated' if login succeeded.
 * Returns 'anonymous' if login failed (AC disabled) or threw (PLC unreachable).
 * Never throws — the app always gets a usable mode.
 */
export async function silentLoginAtStartup(plcAddress: string): Promise<AuthMode> {
    try {
        const ok = await loginToPLC(plcAddress, DEFAULT_USERNAME, DEFAULT_PASSWORD);
        if (ok) {
            console.info('[Auth] Authenticated — token acquired.');
            return 'authenticated';
        }
        console.info('[Auth] Login returned false — PLC may have AC disabled. Using anonymous mode.');
    } catch (err) {
        console.warn('[Auth] Login threw — PLC may be unreachable or AC is disabled:', err);
    }

    // Clear any stale token from a previous session so we don't accidentally
    // send an expired token as if it were valid.
    authToken = null;
    authMode = 'anonymous';
    sessionStorage.removeItem(TOKEN_KEY);
    return 'anonymous';
}

/**
 * Starts a background timer that refreshes the auth token every 60 seconds.
 * Only call this when in 'authenticated' mode.
 */
export function startPeriodicLogin(plcAddress: string): void {
    if (refreshTimer !== null) {
        clearInterval(refreshTimer);
    }

    refreshTimer = window.setInterval(async () => {
        try {
            const ok = await loginToPLC(plcAddress, DEFAULT_USERNAME, DEFAULT_PASSWORD);
            if (!ok) {
                console.warn('[Auth] Periodic re-login failed — token may have expired.');
            }
        } catch (err) {
            console.warn('[Auth] Periodic re-login error:', err);
        }
    }, 60_000);
}

export function logout(): void {
    authToken = null;
    authMode = 'anonymous';

    if (refreshTimer !== null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }

    sessionStorage.removeItem(TOKEN_KEY);
}
