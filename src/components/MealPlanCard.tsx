import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useDeleteMealPlan } from '../hooks/useMealPlans';
import type { MealPlanWeekRead } from '../types/mealPlan';

type MealPlanCardProps = {
  plan: MealPlanWeekRead;
};

function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate} to ${endDate}`;
}

function mealCountForPlan(plan: MealPlanWeekRead): number | null {
  if (typeof plan.meal_count === 'number') {
    return plan.meal_count;
  }
  if (plan.planned_meals.length > 0) {
    return plan.planned_meals.length;
  }
  return null;
}

export function MealPlanCard({ plan }: MealPlanCardProps) {
  const deleteMealPlan = useDeleteMealPlan();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const mealCount = mealCountForPlan(plan);

  const closeConfirm = () => {
    if (deleteMealPlan.isPending) {
      return;
    }
    setConfirmOpen(false);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMealPlan.mutateAsync(plan.id);
      setConfirmOpen(false);
    } catch {
      setDeleteError('Could not delete this plan. Please try again.');
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-primary">{plan.title ?? 'Untitled plan'}</h2>
        <p className="text-sm text-secondary">
          {formatDateRange(plan.start_date, plan.end_date)}
        </p>
        {mealCount !== null ? (
          <Chip
            size="small"
            label={`${mealCount} meal${mealCount === 1 ? '' : 's'}`}
            color="secondary"
            variant="outlined"
            className="mt-1 w-fit"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          component={RouterLink}
          to={`/meal-plans/${plan.id}`}
          variant="outlined"
          color="primary"
        >
          Open
        </Button>
        <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </div>

      <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="sm">
        <DialogTitle>Delete meal plan</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <DialogContentText>
            Delete &ldquo;{plan.title ?? 'Untitled plan'}&rdquo;? This cannot be undone.
          </DialogContentText>
          {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={deleteMealPlan.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteMealPlan.isPending}
            startIcon={
              deleteMealPlan.isPending ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </li>
  );
}
