import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { clearAccessToken } from './src/lib/api/accessToken';
import { server } from './src/__mocks__/server';
import { locationAssign, stubTestLocation } from './src/__tests__/locationMock';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  stubTestLocation('/');
});

afterEach(() => {
  server.resetHandlers();
  locationAssign.mockClear();
  stubTestLocation('/');
  clearAccessToken();
});

afterAll(() => server.close());
