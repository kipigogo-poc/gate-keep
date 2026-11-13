import { appConfig } from './config';
import { getIdToken } from './auth';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function postJson<TReq, TRes>(path: string, body: TReq, signal?: AbortSignal): Promise<TRes> {
  const token = await getIdToken();
  const res = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new ApiError(res.status, res.status === 401 ? 'Sign in as door staff' : `Request failed (${res.status})`);
  return (await res.json()) as TRes;
}
