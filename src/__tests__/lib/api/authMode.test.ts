import { describe, expect, it } from 'vitest';
import { usesBearerTokenAuth, usesCookieAuth } from '../../../lib/api/authMode';

describe('authMode', () => {
  it('uses bearer token auth in test/development builds', () => {
    expect(usesBearerTokenAuth()).toBe(true);
    expect(usesCookieAuth()).toBe(false);
  });
});
