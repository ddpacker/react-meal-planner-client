import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, TextField } from '@mui/material';
import { PageHarnessForm } from '../layout/PageHarness';
import { useUpdateMe } from '../../hooks/useUser';
import { getResponseStatus } from '../../lib/getResponseStatus';

const changeEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .pipe(z.email('Enter a valid email address')),
  current_password: z.string().min(1, 'Current password is required'),
});

type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

type ChangeEmailFormProps = {
  currentEmail: string;
};

export function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const updateMe = useUpdateMe();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: currentEmail, current_password: '' },
  });

  const onSubmit = async (values: ChangeEmailFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      await updateMe.mutateAsync({
        email: values.email,
        current_password: values.current_password,
      });
      reset({ email: values.email, current_password: '' });
      setSuccessMessage('Email updated successfully.');
    } catch (error) {
      if (getResponseStatus(error) === 401) {
        setSubmitError('Current password is incorrect.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <PageHarnessForm onSubmit={handleSubmit(onSubmit)}>
      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}

      <TextField
        label="New email"
        type="email"
        autoComplete="email"
        fullWidth
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...register('email')}
      />

      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        fullWidth
        error={Boolean(errors.current_password)}
        helperText={errors.current_password?.message}
        {...register('current_password')}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        disabled={isSubmitting || updateMe.isPending}
      >
        Update email
      </Button>
    </PageHarnessForm>
  );
}
