import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, TextField } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../lib/api/auth';
import { useAuth } from '../context/AuthContext';

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .pipe(z.email('Enter a valid email address')),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function getResponseStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  return (error as { response?: { status?: number } }).response?.status;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    try {
      await apiRegister(values.email, values.password);
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      if (getResponseStatus(error) === 409) {
        setSubmitError('An account with this email already exists.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-gray-600">
          Sign up to start planning your meals.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password')}
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
