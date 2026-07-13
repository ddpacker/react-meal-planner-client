import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCreateMealPlan } from '../hooks/useMealPlans';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const createMealPlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start_date: z
    .string()
    .min(1, 'Start date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid ISO date (YYYY-MM-DD)'),
  meals: z
    .array(
      z.object({
        meal_name: z.string(),
      }),
    )
    .length(7),
});

type CreateMealPlanFormValues = z.infer<typeof createMealPlanSchema>;

type CreateMealPlanDialogProps = {
  open: boolean;
  onClose: () => void;
};

function addDaysIso(startDate: string, days: number): string {
  const date = new Date(`${startDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const emptyMeals = (): CreateMealPlanFormValues['meals'] =>
  DAY_LABELS.map(() => ({ meal_name: '' }));

export function CreateMealPlanDialog({ open, onClose }: CreateMealPlanDialogProps) {
  const navigate = useNavigate();
  const createMealPlan = useCreateMealPlan();
  const { reset: resetMutation, isPending, isError, mutateAsync } = createMealPlan;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMealPlanFormValues>({
    resolver: zodResolver(createMealPlanSchema),
    defaultValues: {
      title: '',
      start_date: '',
      meals: emptyMeals(),
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    reset({ title: '', start_date: '', meals: emptyMeals() });
    resetMutation();
  }, [open, reset, resetMutation]);

  const handleClose = () => {
    if (isPending || isSubmitting) {
      return;
    }
    onClose();
  };

  const onSubmit = async (values: CreateMealPlanFormValues) => {
    const planned_meals = values.meals
      .map((meal, day_index) => ({
        day_index,
        meal_name: meal.meal_name.trim(),
        status: 'draft' as const,
        courses: [{ role: 'entree' as const, description: null }],
      }))
      .filter((meal) => meal.meal_name.length > 0)
      .slice(0, 7);

    try {
      const plan = await mutateAsync({
        title: values.title.trim(),
        start_date: values.start_date,
        end_date: addDaysIso(values.start_date, 6),
        planned_meals,
      });
      onClose();
      navigate(`/meal-plans/${plan.id}`);
    } catch {
      // Error surfaced via mutation state below.
    }
  };

  const pending = isSubmitting || isPending;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>New meal plan</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="flex flex-col gap-4">
          {isError ? (
            <Alert severity="error">Could not create the meal plan. Please try again.</Alert>
          ) : null}

          <TextField
            label="Plan title"
            fullWidth
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
            disabled={pending}
            {...register('title')}
          />

          <TextField
            label="Start date"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.start_date)}
            helperText={errors.start_date?.message}
            disabled={pending}
            {...register('start_date')}
          />

          <div className="flex flex-col gap-3">
            <p className="text-sm text-secondary">
              Up to seven meals (one per weekday). Leave a day blank to skip it. Each meal
              starts with a Main course slot.
            </p>
            {DAY_LABELS.map((label, index) => (
              <TextField
                key={label}
                label={`${label} meal`}
                fullWidth
                disabled={pending}
                {...register(`meals.${index}.meal_name`)}
              />
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
            Create plan
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
