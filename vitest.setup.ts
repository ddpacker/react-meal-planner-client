import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './src/__mocks__/server';

const locationAssign = vi.fn();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  vi.stubGlobal('location', {
    pathname: '/',
    assign: locationAssign,
  });
});

afterEach(() => {
  server.resetHandlers();
  locationAssign.mockClear();
});

afterAll(() => server.close());
