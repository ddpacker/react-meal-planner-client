import { useState } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { DayMealCard } from '../components/DayMealCard';
import { DayMealDialog } from '../components/DayMealDialog';
import { MealPlanTitleEditor } from '../components/MealPlanTitleEditor';
import { NoFilledMealsError, useGenerateRecipes, useMealPlan } from '../hooks/useMealPlans';
import { DAY_LABELS, isFilledPlannedMeal } from '../lib/mealPlanDays';
import type { PlannedMealRead } from '../types/mealPlan';

function mealsByDayIndex(meals: PlannedMealRead[]): Array<PlannedMealRead | null> {
  const slots: Array<PlannedMealRead | null> = Array.from({ length: 7 }, () => null);
  for (const meal of meals) {
    if (meal.day_index >= 0 && meal.day_index <= 6) {
      slots[meal.day_index] = meal;
    }
  }
  return slots;
}

export default function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const planId = Number(id);
  const { data: plan, isLoading, isError } = useMealPlan(planId);
  const generateRecipes = useGenerateRecipes();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  const filledMealCount = plan?.planned_meals.filter(isFilledPlannedMeal).length ?? 0;

  const handleGenerate = async () => {
    if (!Number.isFinite(planId) || !plan) {
      return;
    }
    setGenerateMessage(null);
    try {
      await generateRecipes.mutateAsync({
        planId,
        plannedMeals: plan.planned_meals,
      });
    } catch (error) {
      if (error instanceof NoFilledMealsError) {
        setGenerateMessage('Add at least one meal name before generating recipes.');
        return;
      }
      // Error shown via mutation state.
    }
  };

  if (!Number.isFinite(planId) || planId <= 0) {
    return (
      <main className="mx-auto max-w-6xl bg-background p-6">
        <Alert severity="error">Invalid meal plan.</Alert>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <CircularProgress />
      </main>
    );
  }

  if (isError || !plan) {
    return (
      <main className="mx-auto max-w-6xl bg-background p-6">
        <Alert severity="error">Could not load this meal plan.</Alert>
        <Button component={RouterLink} to="/" variant="text" color="primary" className="mt-4">
          Back to meal plans
        </Button>
      </main>
    );
  }

  const daySlots = mealsByDayIndex(plan.planned_meals);
  const dialogOpen = selectedDayIndex !== null;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 bg-background p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-secondary">
            <RouterLink to="/" className="text-secondary underline-offset-2 hover:underline">
              Meal plans
            </RouterLink>
          </p>
          <div className="mt-1">
            <MealPlanTitleEditor planId={plan.id} title={plan.title} />
          </div>
          <p className="mt-1 text-sm text-secondary">
            {plan.start_date} to {plan.end_date}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGenerate}
            disabled={generateRecipes.isPending || filledMealCount === 0}
            startIcon={
              generateRecipes.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Generate recipes
          </Button>
          {plan.has_grocery_list && plan.grocery_list_id ? (
            <Button
              component={RouterLink}
              to={`/grocery/${plan.grocery_list_id}`}
              variant="outlined"
              color="secondary"
            >
              Grocery list
            </Button>
          ) : null}
        </div>
      </header>

      {generateMessage ? <Alert severity="info">{generateMessage}</Alert> : null}

      {generateRecipes.isError && !(generateRecipes.error instanceof NoFilledMealsError) ? (
        <Alert severity="error">Recipe generation failed. Please try again.</Alert>
      ) : null}

      <section aria-label="Weekly meals">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {daySlots.map((meal, dayIndex) => (
            <DayMealCard
              key={DAY_LABELS[dayIndex]}
              dayIndex={dayIndex}
              meal={meal}
              onOpen={() => setSelectedDayIndex(dayIndex)}
            />
          ))}
        </div>
      </section>

      {selectedDayIndex !== null ? (
        <DayMealDialog
          open={dialogOpen}
          onClose={() => setSelectedDayIndex(null)}
          plan={plan}
          dayIndex={selectedDayIndex}
          meal={daySlots[selectedDayIndex]}
        />
      ) : null}
    </main>
  );
}
