import { Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { COURSE_ROLE_LABELS, DAY_LABELS, isFilledPlannedMeal } from '../lib/mealPlanDays';
import type { PlannedMealRead } from '../types/mealPlan';

type DayMealCardProps = {
  dayIndex: number;
  meal: PlannedMealRead | null;
  onOpen: () => void;
};

export function DayMealCard({ dayIndex, meal, onOpen }: DayMealCardProps) {
  const dayLabel = DAY_LABELS[dayIndex];
  const empty = !meal || !isFilledPlannedMeal(meal);
  const recipes = !empty && meal?.recipes && meal.recipes.length > 0 ? meal.recipes : [];

  return (
    <article className="flex min-h-44 flex-col overflow-hidden rounded-lg border border-border bg-paper">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col gap-3 p-4 text-left transition hover:bg-primary-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-secondary">{dayLabel}</h2>
          {empty ? (
            <p className="text-base text-secondary">Add meal</p>
          ) : (
            <p className="text-base font-medium text-primary">{meal?.meal_name}</p>
          )}
        </div>

        {!empty && meal ? (
          <>
            <div className="flex flex-wrap gap-1">
              {meal.courses.map((course) => (
                <Chip
                  key={course.id}
                  size="small"
                  label={COURSE_ROLE_LABELS[course.role]}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </div>
            {recipes.length === 0 ? (
              <p className="mt-auto text-xs text-secondary">No recipes yet</p>
            ) : null}
          </>
        ) : null}
      </button>

      {recipes.length > 0 ? (
        <ul className="flex flex-col gap-1 border-t border-border px-4 py-3">
          {recipes.map((recipe) => (
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
    </article>
  );
}
