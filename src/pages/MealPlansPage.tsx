import { useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MealPlanCarousel } from '../components/MealPlanCarousel';
import { useCreateMealPlan, useMealPlans } from '../hooks/useMealPlans';
import {
  buildCarouselSlots,
  buildWeekPlanBody,
  type MealPlanCarouselSlot,
} from '../lib/mealPlanDays';

function mondayFromIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function MealPlansPage() {
  const navigate = useNavigate();
  const { data: plans, isLoading, isError } = useMealPlans();
  const createMealPlan = useCreateMealPlan();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyMondayIso, setBusyMondayIso] = useState<string | null>(null);

  const slots = useMemo(
    () => buildCarouselSlots(plans ?? []),
    [plans],
  );

  const handleActivate = async (slot: MealPlanCarouselSlot) => {
    setActionError(null);
    if (slot.plan) {
      navigate(`/meal-plans/${slot.plan.id}`);
      return;
    }
    setBusyMondayIso(slot.mondayIso);
    try {
      const plan = await createMealPlan.mutateAsync(
        buildWeekPlanBody(mondayFromIso(slot.mondayIso)),
      );
      navigate(`/meal-plans/${plan.id}`);
    } catch {
      setActionError('Could not open this meal plan. Please try again.');
    } finally {
      setBusyMondayIso(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 overflow-x-visible px-6 pb-6 pt-6">
      <header>
        <h1 className="text-2xl font-semibold text-primary">Meal plans</h1>
        <p className="mt-1 text-sm text-secondary">
          Scroll through your weeks. Tap a card to open or start planning.
        </p>
      </header>

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <CircularProgress />
        </div>
      ) : null}

      {isError ? (
        <Alert severity="error">Could not load meal plans. Please try again.</Alert>
      ) : null}

      {!isLoading && !isError && plans ? (
        <MealPlanCarousel
          slots={slots}
          busyMondayIso={busyMondayIso}
          onActivate={handleActivate}
        />
      ) : null}
    </div>
  );
}
