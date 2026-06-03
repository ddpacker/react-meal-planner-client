import { vi } from 'vitest';

export const locationAssign = vi.fn();

export function stubTestLocation(pathname = '/'): void {
  vi.stubGlobal('location', {
    pathname,
    href: `http://localhost${pathname}`,
    origin: 'http://localhost',
    assign: locationAssign,
  });
}
