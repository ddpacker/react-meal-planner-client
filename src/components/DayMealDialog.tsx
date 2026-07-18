import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { useUpdateMealPlan, useUpdatePlannedMeal } from '../hooks/useMealPlans';
import {
  COURSE_ROLE_LABELS,
  DAY_LABELS,
  isFilledPlannedMeal,
  toPlannedMealCreates,
} from '../lib/mealPlanDays';
import type {
  MealCourseRole,
  MealPlanWeekRead,
  PlannedMealCreate,
  PlannedMealRead,
} from '../types/mealPlan';

const courseRoles = ['starter', 'entree', 'side', 'dessert'] as const;

const dayMealSchema = z.object({
  meal_name: z.string().min(1, 'Meal name is required'),
  status: z.enum(['draft', 'planned']),
  courses: z
    .array(
      z.object({
        id: z.number().optional(),
        role: z.enum(courseRoles),
        description: z.string(),
      }),
    )
    .min(1, 'Add at least one course'),
});

type DayMealFormValues = z.infer<typeof dayMealSchema>;

type DayMealDialogProps = {
  open: boolean;
  onClose: () => void;
  plan: MealPlanWeekRead;
  dayIndex: number;
  meal: PlannedMealRead | null;
};

function coursePayload(values: DayMealFormValues) {
  return values.courses.map((course) => ({
    ...(course.id !== undefined ? { id: course.id } : {}),
    role: course.role as MealCourseRole,
    description: course.description.trim() ? course.description.trim() : null,
  }));
}

export function DayMealDialog({ open, onClose, plan, dayIndex, meal }: DayMealDialogProps) {
  const updatePlannedMeal = useUpdatePlannedMeal();
  const updateMealPlan = useUpdateMealPlan();
  const dayLabel = DAY_LABELS[dayIndex];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DayMealFormValues>({
    resolver: zodResolver(dayMealSchema),
    defaultValues: {
      meal_name: '',
      status: 'draft',
      courses: [{ role: 'entree', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'courses' });

  // Reset when the dialog opens for a given day — not on every mutation/meal identity churn.
  useEffect(() => {
    if (!open) {
      return;
    }
    updatePlannedMeal.reset();
    updateMealPlan.reset();
    reset({
      meal_name: meal && isFilledPlannedMeal(meal) ? meal.meal_name : '',
      status: meal?.status === 'planned' ? 'planned' : 'draft',
      courses:
        meal && meal.courses.length > 0
          ? meal.courses.map((course) => ({
              id: course.id,
              role: course.role,
              description: course.description ?? '',
            }))
          : [{ role: 'entree' as const, description: '' }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only when opening/switching day
  }, [open, dayIndex]);

  const pending =
    isSubmitting || updatePlannedMeal.isPending || updateMealPlan.isPending;
  const isError = updatePlannedMeal.isError || updateMealPlan.isError;

  const handleClose = () => {
    if (pending) {
      return;
    }
    onClose();
  };

  const onSubmit = async (values: DayMealFormValues) => {
    const courses = coursePayload(values);
    const mealName = values.meal_name.trim();

    try {
      // Prefer PATCH when the row already exists and is a real (filled) meal — preserves IDs.
      if (meal && isFilledPlannedMeal(meal)) {
        await updatePlannedMeal.mutateAsync({
          planId: plan.id,
          mealId: meal.id,
          body: {
            meal_name: mealName,
            status: values.status,
            courses,
          },
        });
      } else {
        // New day (or leftover weekday placeholder): replace plan meals with filled ones only.
        // Never write Mon/Tue/... placeholders — those would look “empty” and confuse generate.
        const otherFilled = plan.planned_meals.filter(
          (row) => row.day_index !== dayIndex && isFilledPlannedMeal(row),
        );
        const nextMeal: PlannedMealCreate = {
          day_index: dayIndex,
          meal_name: mealName,
          status: values.status,
          courses: courses.map(({ role, description }) => ({ role, description })),
        };
        await updateMealPlan.mutateAsync({
          id: plan.id,
          body: {
            planned_meals: [...toPlannedMealCreates(otherFilled), nextMeal],
          },
        });
      }
      onClose();
    } catch {
      // Error surfaced via mutation state.
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{dayLabel} meal</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="flex flex-col gap-4">
          {isError ? (
            <Alert severity="error">Could not save this meal. Please try again.</Alert>
          ) : null}

          <TextField
            label="Meal name"
            fullWidth
            error={Boolean(errors.meal_name)}
            helperText={errors.meal_name?.message}
            disabled={pending}
            {...register('meal_name')}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Status"
                select
                fullWidth
                disabled={pending}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="planned">Planned</MenuItem>
              </TextField>
            )}
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-primary">Courses</p>
              <Button
                type="button"
                size="small"
                onClick={() => append({ role: 'side', description: '' })}
                disabled={pending}
              >
                Add course
              </Button>
            </div>
            {errors.courses?.root?.message || errors.courses?.message ? (
              <Alert severity="error">
                {errors.courses.root?.message ?? errors.courses.message}
              </Alert>
            ) : null}
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Controller
                  name={`courses.${index}.role`}
                  control={control}
                  render={({ field: roleField }) => (
                    <TextField {...roleField} label="Role" select fullWidth disabled={pending}>
                      {courseRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {COURSE_ROLE_LABELS[role]}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  label="Description (optional)"
                  fullWidth
                  disabled={pending}
                  {...register(`courses.${index}.description`)}
                />
                <Button
                  type="button"
                  size="small"
                  color="secondary"
                  onClick={() => remove(index)}
                  disabled={pending || fields.length <= 1}
                  className="self-start"
                >
                  Remove course
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Save meal
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
