import { http, HttpResponse } from 'msw';
import {
  API_BASE_URL,
  applyAuthenticatedSessionHandlers,
  mockUser,
} from './authHandlers';
import { server } from './server';
import type { UnitSystem, UserRead, UserUpdate } from '../types/user';

type ProfileSessionOptions = {
  user?: UserRead;
  unitSystem?: UnitSystem;
};

/** MSW handlers for an authenticated profile session (GET /users/me + preferences). */
export function applyProfileSessionHandlers({
  user = mockUser,
  unitSystem = 'metric',
}: ProfileSessionOptions = {}): void {
  applyAuthenticatedSessionHandlers(user, unitSystem);
}

type UpdateMeHandlerOptions = {
  user?: UserRead;
  onRequest?: (body: UserUpdate) => void;
};

export function applyUpdateMeHandler({
  user = mockUser,
  onRequest,
}: UpdateMeHandlerOptions = {}): void {
  server.use(
    http.patch(`${API_BASE_URL}/users/me`, async ({ request }) => {
      const body = (await request.json()) as UserUpdate;
      onRequest?.(body);
      return HttpResponse.json({ ...user, ...body, email: body.email ?? user.email });
    }),
  );
}

type UpdatePreferencesHandlerOptions = {
  unitSystem?: UnitSystem;
  onRequest?: (body: { unit_system: UnitSystem }) => void;
};

export function applyUpdatePreferencesHandler({
  unitSystem = 'imperial',
  onRequest,
}: UpdatePreferencesHandlerOptions = {}): void {
  server.use(
    http.patch(`${API_BASE_URL}/users/me/preferences`, async ({ request }) => {
      const body = (await request.json()) as { unit_system: UnitSystem };
      onRequest?.(body);
      return HttpResponse.json({ unit_system: body.unit_system ?? unitSystem });
    }),
  );
}

type DeleteMeHandlerOptions = {
  onRequest?: (body: { password: string }) => void;
};

export function applyDeleteMeHandler({ onRequest }: DeleteMeHandlerOptions = {}): void {
  server.use(
    http.delete(`${API_BASE_URL}/users/me`, async ({ request }) => {
      const body = (await request.json()) as { password: string };
      onRequest?.(body);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API_BASE_URL}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  );
}
