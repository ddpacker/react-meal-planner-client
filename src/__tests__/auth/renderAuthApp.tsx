import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { AppThemeProvider } from '../../lib/theme/AppThemeProvider';
import { createTestQueryClient } from '../utils';

type RenderAuthAppOptions = {
  pagePath: string;
  page: ReactElement;
  initialPath: string;
};

export function renderAuthApp({ pagePath, page, initialPath }: RenderAuthAppOptions) {
  const queryClient = createTestQueryClient();

  return render(
    <AppThemeProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="*"
              element={
                <AuthProvider>
                  <Routes>
                    <Route path={pagePath} element={page} />
                    <Route path="/" element={<div>Home</div>} />
                  </Routes>
                </AuthProvider>
              }
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </AppThemeProvider>,
  );
}
