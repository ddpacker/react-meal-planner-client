import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../../pages/ProfilePage';
import { mockUser } from '../../__mocks__/authHandlers';
import {
  applyDeleteMeHandler,
  applyProfileSessionHandlers,
  applyUpdateMeHandler,
  applyUpdatePreferencesHandler,
} from '../../__mocks__/userHandlers';
import { renderAuthApp } from '../auth/renderAuthApp';

async function renderProfilePage() {
  renderAuthApp({
    pagePath: '/profile',
    page: <ProfilePage />,
    initialPath: '/profile',
  });

  await waitFor(() => {
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });
}

describe('ProfilePage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the current user email', async () => {
    applyProfileSessionHandlers();
    await renderProfilePage();
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it('validates the change email form before submit', async () => {
    applyProfileSessionHandlers();
    const user = userEvent.setup();
    await renderProfilePage();

    const accountSection = screen.getByRole('heading', { name: 'Account' }).closest('section');
    expect(accountSection).not.toBeNull();

    await user.clear(within(accountSection!).getByLabelText('New email'));
    await user.click(within(accountSection!).getByRole('button', { name: /update email/i }));

    expect(await within(accountSection!).findByText('Email is required')).toBeInTheDocument();
    expect(
      within(accountSection!).queryByText('Email updated successfully.'),
    ).not.toBeInTheDocument();
  });

  it('submits the change email form', async () => {
    applyProfileSessionHandlers();
    let patchBody: unknown;
    applyUpdateMeHandler({
      onRequest: (body) => {
        patchBody = body;
      },
    });

    const user = userEvent.setup();
    await renderProfilePage();

    const accountSection = screen.getByRole('heading', { name: 'Account' }).closest('section');
    expect(accountSection).not.toBeNull();

    await user.clear(within(accountSection!).getByLabelText('New email'));
    await user.type(within(accountSection!).getByLabelText('New email'), 'new@example.com');
    await user.type(
      within(accountSection!).getByLabelText('Current password'),
      'current-secret',
    );
    await user.click(within(accountSection!).getByRole('button', { name: /update email/i }));

    await waitFor(() => {
      expect(
        within(accountSection!).getByText('Email updated successfully.'),
      ).toBeInTheDocument();
    });
    expect(patchBody).toEqual({
      email: 'new@example.com',
      current_password: 'current-secret',
    });
  });

  it('submits the change password form', async () => {
    applyProfileSessionHandlers();
    let patchBody: unknown;
    applyUpdateMeHandler({
      onRequest: (body) => {
        patchBody = body;
      },
    });

    const user = userEvent.setup();
    await renderProfilePage();

    const passwordSection = screen.getByRole('heading', { name: 'Password' }).closest('section');
    expect(passwordSection).not.toBeNull();

    await user.type(
      within(passwordSection!).getByLabelText('Current password'),
      'current-secret',
    );
    await user.type(within(passwordSection!).getByLabelText('New password'), 'new-secret');
    await user.type(
      within(passwordSection!).getByLabelText('Confirm new password'),
      'new-secret',
    );
    await user.click(within(passwordSection!).getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(
        within(passwordSection!).getByText('Password updated successfully.'),
      ).toBeInTheDocument();
    });
    expect(patchBody).toEqual({
      current_password: 'current-secret',
      password: 'new-secret',
    });
  });

  it('calls updatePreferences when the unit toggle changes', async () => {
    applyProfileSessionHandlers({ unitSystem: 'metric' });
    let patchBody: unknown;
    applyUpdatePreferencesHandler({
      onRequest: (body) => {
        patchBody = body;
      },
    });

    const user = userEvent.setup();
    await renderProfilePage();

    await user.click(screen.getByRole('button', { name: 'Imperial' }));

    await waitFor(() => {
      expect(patchBody).toEqual({ unit_system: 'imperial' });
    });
  });

  it('requires a password before deleting the account', async () => {
    applyProfileSessionHandlers();
    let deleteBody: unknown;
    applyDeleteMeHandler({
      onRequest: (body) => {
        deleteBody = body;
      },
    });

    const user = userEvent.setup();
    await renderProfilePage();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));

    const dialog = screen.getByRole('dialog');
    const confirmDeleteButton = within(dialog).getByRole('button', { name: 'Delete account' });

    expect(confirmDeleteButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Current password'), 'current-secret');
    expect(confirmDeleteButton).toBeEnabled();

    await user.click(confirmDeleteButton);

    await waitFor(() => {
      expect(deleteBody).toEqual({ password: 'current-secret' });
    });
  });
});
