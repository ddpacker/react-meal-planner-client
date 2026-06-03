import { useEffect } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleCallbackSession } from '../hooks/useGoogleCallbackSession';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const sessionQuery = useGoogleCallbackSession();

  useEffect(() => {
    if (sessionQuery.isSuccess) {
      navigate('/', { replace: true });
    }
  }, [sessionQuery.isSuccess, navigate]);

  if (sessionQuery.isError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
        <Alert severity="error">
          Google sign-in failed. Please try again or use email and password.
        </Alert>
        <Button component={Link} to="/login" variant="contained">
          Back to sign in
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <CircularProgress />
      <p className="text-sm text-gray-600">Completing Google sign-in…</p>
    </main>
  );
}
