import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  PageHarness,
  PageHarnessFooter,
  PageHarnessForm,
  PageHarnessHeader,
  PageHarnessLink,
} from '../components/layout/PageHarness';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setCredentialsError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      if (isUnauthorized(error)) {
        setCredentialsError('Invalid email or password.');
      } else {
        setCredentialsError('Something went wrong. Please try again.');
      }
    }
  };

  const signInWithGoogle = () => {
    window.location.assign(`${apiBaseUrl}/auth/google`);
  };

  return (
    <PageHarness>
      <PageHarnessHeader
        title="Sign in"
        description="Welcome back. Sign in to plan your meals."
      />

      <PageHarnessForm onSubmit={handleSubmit(onSubmit)}>
        {credentialsError ? (
          <Alert severity="error">{credentialsError}</Alert>
        ) : null}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          fullWidth
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          fullWidth
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={isSubmitting}
        >
          Sign in
        </Button>
      </PageHarnessForm>

      <Button
        variant="outlined"
        color="secondary"
        size="large"
        fullWidth
        onClick={signInWithGoogle}
      >
        Sign in with Google
      </Button>

      <PageHarnessFooter>
        Don&apos;t have an account?{' '}
        <PageHarnessLink to="/register">Create one</PageHarnessLink>
      </PageHarnessFooter>
    </PageHarness>
  );
}
