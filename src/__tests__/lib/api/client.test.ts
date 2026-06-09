import { describe, expect, it } from 'vitest';
import { resolveApiBaseURL } from '../../../lib/api/baseUrl';
import { apiClient } from '../../../lib/api/client';

describe('resolveApiBaseURL', () => {
  it('uses the test API URL in vitest', () => {
    expect(resolveApiBaseURL()).toBe('http://localhost:8000');
  });
});

describe('apiClient', () => {
  it('exports a configured axios instance', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8000');
  });

  it('sends cookies on requests', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
