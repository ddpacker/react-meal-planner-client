import { Divider } from '@mui/material';
import { ChangeEmailForm } from '../components/profile/ChangeEmailForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { DeleteAccountSection } from '../components/profile/DeleteAccountSection';
import { UnitSystemPreference } from '../components/profile/UnitSystemPreference';
import {
  PageHarness,
  PageHarnessFooter,
  PageHarnessHeader,
  PageHarnessLink,
  PageHarnessSection,
} from '../components/layout/PageHarness';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <PageHarness maxWidth="lg">
      <PageHarnessHeader
        title="Profile"
        description="Manage your account and preferences."
      />

      <PageHarnessSection title="Account">
        <p className="text-sm text-secondary">
          Signed in as <span className="font-medium text-primary">{user.email}</span>
        </p>
        <ChangeEmailForm currentEmail={user.email} />
      </PageHarnessSection>

      <Divider />

      <PageHarnessSection title="Password">
        <ChangePasswordForm />
      </PageHarnessSection>

      <Divider />

      <PageHarnessSection
        title="Preferences"
        description="Choose how quantities are displayed throughout the app."
      >
        <UnitSystemPreference />
      </PageHarnessSection>

      <Divider />

      <PageHarnessSection
        title="Danger zone"
        description="Permanently delete your account and all associated data."
      >
        <DeleteAccountSection />
      </PageHarnessSection>

      <PageHarnessFooter>
        <PageHarnessLink to="/">Back to meal plans</PageHarnessLink>
      </PageHarnessFooter>
    </PageHarness>
  );
}
