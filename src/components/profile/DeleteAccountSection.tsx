import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useDeleteMe } from '../../hooks/useUser';
import { getResponseStatus } from '../../lib/getResponseStatus';

export function DeleteAccountSection() {
  const deleteMe = useDeleteMe();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const closeDialog = () => {
    if (deleteMe.isPending) {
      return;
    }
    setDialogOpen(false);
    setPassword('');
    setSubmitError(null);
  };

  const handleDelete = async () => {
    if (!password) {
      return;
    }
    setSubmitError(null);
    try {
      await deleteMe.mutateAsync(password);
    } catch (error) {
      if (getResponseStatus(error) === 401) {
        setSubmitError('Password is incorrect.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <>
      <Button variant="outlined" color="error" onClick={() => setDialogOpen(true)}>
        Delete account
      </Button>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <DialogContentText>
            This will permanently delete your account and all associated data, including meal
            plans, recipes, and chat history. This action cannot be undone.
          </DialogContentText>

          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={deleteMe.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={deleteMe.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={!password || deleteMe.isPending}
            startIcon={deleteMe.isPending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Delete account
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
