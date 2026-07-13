import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useUpdatePlannedMeal } from '../hooks/useMealPlans';
import type {
  MealCourseRole,
  PlannedMealRead,
  PlannedMealStatus,
} from '../types/mealPlan';

const COURSE_ROLE_LABELS: Record<MealCourseRole, string> = {
  starter: 'Starter',
  entree: 'Main',
  side: 'Side',
  dessert: 'Dessert',
};

type PlannedMealSlotProps = {
  planId: number;
  meal: PlannedMealRead | null;
  dayLabel: string;
};

export function PlannedMealSlot({ planId, meal, dayLabel }: PlannedMealSlotProps) {
  const updateMeal = useUpdatePlannedMeal();
  const [editing, setEditing] = useState(false);
  const [mealName, setMealName] = useState(meal?.meal_name ?? '');
  const [status, setStatus] = useState<PlannedMealStatus>(
    meal?.status === 'planned' ? 'planned' : 'draft',
  );
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    if (!meal) {
      return;
    }
    setMealName(meal.meal_name);
    setStatus(meal.status === 'planned' ? 'planned' : 'draft');
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (updateMeal.isPending) {
      return;
    }
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    if (!meal || !mealName.trim()) {
      return;
    }
    setError(null);
    try {
      await updateMeal.mutateAsync({
        planId,
        mealId: meal.id,
        body: { meal_name: mealName.trim(), status },
      });
      setEditing(false);
    } catch {
      setError('Could not update this meal. Please try again.');
    }
  };

  return (
    <article className="flex flex-col gap-2 border-t border-border pt-3">
      <h2 className="text-sm font-medium text-secondary">{dayLabel}</h2>

      {!meal ? <p className="text-sm text-secondary">No meal planned</p> : null}

      {meal && !editing ? (
        <>
          <button
            type="button"
            onClick={startEditing}
            className="text-left text-base font-medium text-primary underline-offset-2 hover:underline"
          >
            {meal.meal_name}
          </button>
          <p className="text-xs text-secondary capitalize">{meal.status}</p>
          <ul className="flex flex-col gap-2">
            {meal.courses.map((course) => (
              <li key={course.id} className="flex flex-col gap-1">
                <Chip
                  size="small"
                  label={COURSE_ROLE_LABELS[course.role]}
                  color="secondary"
                  variant="outlined"
                  className="w-fit"
                />
                {course.description ? (
                  <p className="text-xs text-secondary">{course.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
          {meal.recipes && meal.recipes.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {meal.recipes.map((recipe) => (
                <li key={recipe.id}>
                  <RouterLink
                    to={`/recipes/${recipe.recipe_id}`}
                    className="text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {recipe.recipe_title ?? `Recipe ${recipe.recipe_id}`}
                  </RouterLink>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {meal && editing ? (
        <div className="flex flex-col gap-3">
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Meal name"
            value={mealName}
            onChange={(event) => setMealName(event.target.value)}
            fullWidth
            size="small"
            disabled={updateMeal.isPending}
          />
          <TextField
            label="Status"
            select
            value={status}
            onChange={(event) => setStatus(event.target.value as PlannedMealStatus)}
            fullWidth
            size="small"
            disabled={updateMeal.isPending}
          >
            <MenuItem value="draft">draft</MenuItem>
            <MenuItem value="planned">planned</MenuItem>
          </TextField>
          <div className="flex gap-2">
            <Button size="small" onClick={cancelEditing} disabled={updateMeal.isPending}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={save}
              disabled={!mealName.trim() || updateMeal.isPending}
              startIcon={
                updateMeal.isPending ? <CircularProgress size={14} color="inherit" /> : null
              }
            >
              Save
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
