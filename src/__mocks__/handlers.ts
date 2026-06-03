import { http, HttpResponse } from 'msw';

export const handlers = [
  // add per-resource handlers here as features are implemented
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
];
