import { useState } from 'react';
import { Alert, Button, CircularProgress, TextField } from '@mui/material';
import { useUpdateMealPlan } from '../hooks/useMealPlans';

type MealPlanTitleEditorProps = {
  planId: number;
  title: string | null;
};

export function MealPlanTitleEditor({ planId, title }: MealPlanTitleEditorProps) {
  const updateMealPlan = useUpdateMealPlan();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title ?? '');
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(title ?? '');
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    if (updateMealPlan.isPending) {
      return;
    }
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    const nextTitle = draft.trim();
    if (!nextTitle) {
      setError('Title is required.');
      return;
    }
    setError(null);
    try {
      await updateMealPlan.mutateAsync({ id: planId, body: { title: nextTitle } });
      setEditing(false);
    } catch {
      setError('Could not update the title. Please try again.');
    }
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-primary">{title ?? 'Untitled plan'}</h1>
        <Button size="small" color="secondary" onClick={startEditing}>
          Rename
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-lg flex-col gap-2">
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Plan title"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        fullWidth
        size="small"
        disabled={updateMealPlan.isPending}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="small" onClick={cancel} disabled={updateMealPlan.isPending}>
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={save}
          disabled={updateMealPlan.isPending}
          startIcon={
            updateMealPlan.isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}
