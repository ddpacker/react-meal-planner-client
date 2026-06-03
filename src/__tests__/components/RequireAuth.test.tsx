import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../../components/RequireAuth';
import { renderWithProviders } from '../utils';

function ProtectedContent() {
  return <div>Protected content</div>;
}

function LoginPage() {
  return <div>Login page</div>;
}

function renderRequireAuth(
  authState: { isAuthenticated: boolean; isLoading?: boolean },
  initialEntries = ['/'],
) {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<ProtectedContent />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
    </Routes>,
    { authState, initialEntries },
  );
}

describe('RequireAuth', () => {
  it('renders a full-page spinner while isLoading', () => {
    renderRequireAuth({ isAuthenticated: false, isLoading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderRequireAuth({ isAuthenticated: false, isLoading: false });

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders child routes when authenticated', () => {
    renderRequireAuth({ isAuthenticated: true, isLoading: false });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
