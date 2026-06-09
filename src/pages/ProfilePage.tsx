import { Divider } from '@mui/material';
import { ChangeEmailForm } from '../components/profile/ChangeEmailForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { DeleteAccountSection } from '../components/profile/DeleteAccountSection';
import { UnitSystemPreference } from '../components/profile/UnitSystemPreference';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-primary">Profile</h1>
        <p className="text-sm text-secondary">Manage your account and preferences.</p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-primary">Account</h2>
          <p className="text-sm text-secondary">
            Signed in as <span className="font-medium text-primary">{user.email}</span>
          </p>
        </div>
        <ChangeEmailForm currentEmail={user.email} />
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-primary">Password</h2>
        <ChangePasswordForm />
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-primary">Preferences</h2>
          <p className="text-sm text-secondary">
            Choose how quantities are displayed throughout the app.
          </p>
        </div>
        <UnitSystemPreference />
      </section>

      <Divider />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-primary">Danger zone</h2>
          <p className="text-sm text-secondary">
            Permanently delete your account and all associated data.
          </p>
        </div>
        <DeleteAccountSection />
      </section>
    </main>
  );
}
