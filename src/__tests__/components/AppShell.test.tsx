import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import GroceryListPage from '../../pages/GroceryListPage';
import { renderWithProviders } from '../utils';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

function PlaceholderPage({ title }: { title: string }) {
  return <h1>{title}</h1>;
}

function renderShell(initialPath = '/') {
  const logout = vi.fn(async () => {});

  renderWithProviders(
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <>
              <PathProbe />
              <PlaceholderPage title="Meal plans" />
            </>
          }
        />
        <Route path="recipes" element={<PlaceholderPage title="Recipes" />} />
        <Route path="grocery" element={<GroceryListPage />} />
        <Route path="grocery/:listId" element={<GroceryListPage />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" />} />
      </Route>
    </Routes>,
    {
      initialEntries: [initialPath],
      authState: { isAuthenticated: true, isLoading: false, logout },
    },
  );

  return { logout };
}

afterEach(() => {
  cleanup();
});

describe('AppShell', () => {
  it('renders the header and footer', () => {
    renderShell();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Meal Planner home' })).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} Meal Planner/)).toBeInTheDocument();
  });

  it('navigates from primary nav links', async () => {
    const user = userEvent.setup();
    renderShell();

    const primaryNav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(primaryNav).getByRole('link', { name: 'Recipes' }));
    expect(screen.getByRole('heading', { name: 'Recipes' })).toBeInTheDocument();

    await user.click(within(primaryNav).getByRole('link', { name: 'Grocery' }));
    expect(screen.getByRole('heading', { name: 'Grocery list' })).toBeInTheDocument();
    expect(screen.getByText(/no list selected/i)).toBeInTheDocument();

    await user.click(within(primaryNav).getByRole('link', { name: 'Meal plans' }));
    expect(screen.getByTestId('pathname')).toHaveTextContent('/');
  });

  it('opens the profile menu and navigates to profile', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Profile' }));

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('logs out from the profile menu', async () => {
    const user = userEvent.setup();
    const { logout } = renderShell();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('opens the drawer and navigates from hamburger links', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const mobileNav = await screen.findByRole('navigation', { name: 'Mobile' });
    await user.click(within(mobileNav).getByRole('link', { name: 'Recipes' }));

    await waitFor(() => {
      expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Recipes' })).toBeInTheDocument();
  });

  it('renders a grocery list when a list id is present', () => {
    renderShell('/grocery/1');

    expect(screen.getByRole('heading', { name: 'Grocery list 1' })).toBeInTheDocument();
  });
});
