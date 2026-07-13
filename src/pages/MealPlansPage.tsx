import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { MealPlanCard } from '../components/MealPlanCard';
import { useMealPlans } from '../hooks/useMealPlans';

export default function MealPlansPage() {
  const { data: plans, isLoading, isError } = useMealPlans();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-background p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Meal plans</h1>
          <p className="mt-1 text-sm text-secondary">
            Plan your week and generate recipes for each meal.
          </p>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
        >
          New plan
        </Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <CircularProgress />
        </div>
      ) : null}

      {isError ? (
        <Alert severity="error">Could not load meal plans. Please try again.</Alert>
      ) : null}

      {!isLoading && !isError && plans && plans.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-12">
          <p className="text-secondary">No meal plans yet. Create your first weekly plan.</p>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            New plan
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && plans && plans.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {plans.map((plan) => (
            <MealPlanCard key={plan.id} plan={plan} />
          ))}
        </ul>
      ) : null}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New meal plan</DialogTitle>
        <DialogContent>
          <p className="text-sm text-secondary">Create form coming soon.</p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
