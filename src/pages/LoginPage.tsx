import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, TextField } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600">
          Welcome back. Sign in to plan your meals.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {credentialsError ? (
          <Alert severity="error">{credentialsError}</Alert>
        ) : null}

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
          autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Sign in
        </Button>
      </form>

      <Button variant="outlined" onClick={signInWithGoogle}>
        Sign in with Google
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
