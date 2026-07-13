import { Divider } from '@mui/material';
import { ChangeEmailForm } from '../components/profile/ChangeEmailForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { DeleteAccountSection } from '../components/profile/DeleteAccountSection';
import { UnitSystemPreference } from '../components/profile/UnitSystemPreference';
import {
  PageTemplate,
  PageTemplateFooter,
  PageTemplateHeader,
  PageTemplateLink,
  PageTemplateSection,
} from '../components/layout/PageTemplate';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <PageTemplate maxWidth="lg">
      <PageTemplateHeader
        title="Profile"
        description="Manage your account and preferences."
      />

      <PageTemplateSection title="Account">
        <p className="text-sm text-secondary">
          Signed in as <span className="font-medium text-primary">{user.email}</span>
        </p>
        <ChangeEmailForm currentEmail={user.email} />
      </PageTemplateSection>

      <Divider />

      <PageTemplateSection title="Password">
        <ChangePasswordForm />
      </PageTemplateSection>

      <Divider />

      <PageTemplateSection
        title="Preferences"
        description="Choose how quantities are displayed throughout the app."
      >
        <UnitSystemPreference />
      </PageTemplateSection>

      <Divider />

      <PageTemplateSection
        title="Danger zone"
        description="Permanently delete your account and all associated data."
      >
        <DeleteAccountSection />
      </PageTemplateSection>

      <PageTemplateFooter>
        <PageTemplateLink to="/">Back to meal plans</PageTemplateLink>
      </PageTemplateFooter>
    </PageTemplate>
  );
}
