import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/__mocks__/server';
import { locationAssign, stubTestLocation } from './src/__tests__/locationMock';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  stubTestLocation('/');
});

afterEach(() => {
  server.resetHandlers();
  locationAssign.mockClear();
  stubTestLocation('/');
});

afterAll(() => server.close());
