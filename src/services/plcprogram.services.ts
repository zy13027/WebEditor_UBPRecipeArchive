import {
  PlcProgramRead,
  PlcProgramWrite,
  type PlcProgramReadResponse,
  type PlcProgramWriteResponse,
} from '@siemens/simatic-s7-webserver-api';

import { createRequestConfig } from './request-config.services';
import { getAuthToken } from './auth.services';

const DEFAULT_MODE = 'simple';

function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }
  return token;
}

export async function readTag<T>(variable: string): Promise<T> {
  const req = new PlcProgramRead(
      createRequestConfig(),
      requireAuthToken(),
      variable,
      DEFAULT_MODE
  );

  const res = await req.execute() as PlcProgramReadResponse | null;

  if (!res || res.error || res.result === undefined) {
    const detail = res?.error
        ? `API ${res.error.code}: ${res.error.message}`
        : 'no response';
    const err = new Error(`PlcProgramRead failed [${variable}]: ${detail}`);
    console.error('[PLC] Read failed:', { variable, error: res?.error });
    throw err;
  }

  return res.result as T;
}

export async function writeTag(variable: string, value: unknown): Promise<void> {
  const req = new PlcProgramWrite(
      createRequestConfig(),
      requireAuthToken(),
      variable,
      value,
      DEFAULT_MODE
  );

  const res = await req.execute() as PlcProgramWriteResponse | null;

  if (!res || res.error || res.result !== true) {
    const detail = res?.error
        ? `API ${res.error.code}: ${res.error.message}`
        : 'no response';
    const err = new Error(`PlcProgramWrite failed [${variable}]: ${detail}`);
    console.error('[PLC] Write failed:', { variable, value, error: res?.error });
    throw err;
  }
}

export async function readMany(paths: string[]): Promise<unknown[]> {
  if (paths.length === 0) {
    return [];
  }

  const config = createRequestConfig();
  const token = requireAuthToken();

  const paramsArray = paths.map((path) => ({
    var: path,
    mode: DEFAULT_MODE,
  }));

  const results = await new PlcProgramRead(
      config,
      token,
      '',
      DEFAULT_MODE
  ).bulkExecute(paramsArray);

  if (!results) {
    throw new Error('Bulk read failed: no response');
  }

  return results.map((item, index) => {
    if (!item || item.error || item.result === undefined) {
      const detail = item?.error
          ? `${item.error.code}: ${item.error.message}`
          : 'unknown error';
      throw new Error(`Bulk read failed: ${paths[index]} (${detail})`);
    }
    return item.result;
  });
}

export async function writeMany(items: Array<{ path: string; value: unknown }>): Promise<void> {
  for (const item of items) {
    await writeTag(item.path, item.value);
  }
}
