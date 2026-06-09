import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, TextField } from '@mui/material';
import { useUpdateMe } from '../../hooks/useUser';
import { getResponseStatus } from '../../lib/getResponseStatus';

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(1, 'New password is required'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const updateMe = useUpdateMe();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      await updateMe.mutateAsync({
        current_password: values.current_password,
        password: values.password,
      });
      reset();
      setSuccessMessage('Password updated successfully.');
    } catch (error) {
      if (getResponseStatus(error) === 401) {
        setSubmitError('Current password is incorrect.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}

      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        fullWidth
        error={Boolean(errors.current_password)}
        helperText={errors.current_password?.message}
        {...register('current_password')}
      />

      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        fullWidth
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...register('password')}
      />

      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        fullWidth
        error={Boolean(errors.confirm_password)}
        helperText={errors.confirm_password?.message}
        {...register('confirm_password')}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting || updateMe.isPending}
      >
        Update password
      </Button>
    </form>
  );
}
