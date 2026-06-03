import { describe, expect, it } from 'vitest';
import { apiClient } from '../../../lib/api/client';

describe('apiClient', () => {
  it('exports a configured axios instance', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8000');
  });
});
