import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useCreateRecipe, useUpdateRecipe } from '../hooks/useRecipes';
import {
  fromMetricQuantity,
  IMPERIAL_UNITS,
  INGREDIENT_CATEGORIES,
  METRIC_UNITS,
  toMetricQuantity,
} from '../lib/formatQuantity';
import type { RecipeCreate, RecipeRead } from '../types/recipe';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
});

const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  servings: z.coerce.number().int().min(1, 'Servings must be at least 1'),
  instructions: z.string().min(1, 'Instructions are required'),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

type RecipeFormProps = {
  recipe?: RecipeRead;
  onSuccess?: (recipe: RecipeRead) => void;
  onCancel?: () => void;
};

const emptyIngredient = {
  name: '',
  quantity: 1,
  unit: 'g',
  category: 'other',
};

function defaultValues(
  recipe: RecipeRead | undefined,
  unitSystem: 'metric' | 'imperial',
): RecipeFormValues {
  const defaultUnit = unitSystem === 'imperial' ? 'oz' : 'g';

  if (!recipe) {
    return {
      title: '',
      servings: 4,
      instructions: '',
      ingredients: [{ ...emptyIngredient, unit: defaultUnit }],
    };
  }

  return {
    title: recipe.title,
    servings: recipe.servings,
    instructions: recipe.instructions,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ingredient) => {
            const display = fromMetricQuantity(
              ingredient.quantity,
              ingredient.unit,
              unitSystem,
            );
            return {
              name: ingredient.name,
              quantity: display.quantity,
              unit: display.unit,
              category: ingredient.category,
            };
          })
        : [{ ...emptyIngredient, unit: defaultUnit }],
  };
}

export function RecipeForm({ recipe, onSuccess, onCancel }: RecipeFormProps) {
  const { unitSystem } = useAuth();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const isEdit = recipe !== undefined;
  const unitOptions = unitSystem === 'imperial' ? IMPERIAL_UNITS : METRIC_UNITS;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: defaultValues(recipe, unitSystem),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  useEffect(() => {
    createRecipe.reset();
    updateRecipe.reset();
    reset(defaultValues(recipe, unitSystem));
    // Intentionally omit mutation objects — only re-seed when recipe/units change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset mutation error state once per open
  }, [recipe, unitSystem, reset]);

  const mutationError = isEdit ? updateRecipe.error : createRecipe.error;
  const pending = isSubmitting || createRecipe.isPending || updateRecipe.isPending;

  const onSubmit = handleSubmit(async (values) => {
    const body: RecipeCreate = {
      title: values.title.trim(),
      servings: values.servings,
      instructions: values.instructions.trim(),
      ingredients: values.ingredients.map((ingredient) => {
        const metric = toMetricQuantity(
          ingredient.quantity,
          ingredient.unit,
          unitSystem,
        );
        return {
          name: ingredient.name.trim(),
          quantity: metric.quantity,
          unit: metric.unit,
          category: ingredient.category,
        };
      }),
    };

    try {
      const saved = isEdit
        ? await updateRecipe.mutateAsync({ id: recipe.id, body })
        : await createRecipe.mutateAsync(body);
      onSuccess?.(saved);
    } catch {
      // Error surfaced via mutationError below.
    }
  });

  return (
    <form className="flex flex-col gap-5 pt-2" onSubmit={onSubmit} noValidate>
      <TextField
        label="Title"
        fullWidth
        error={Boolean(errors.title)}
        helperText={errors.title?.message}
        {...register('title')}
      />

      <TextField
        label="Servings"
        type="number"
        fullWidth
        inputProps={{ min: 1, step: 1 }}
        error={Boolean(errors.servings)}
        helperText={errors.servings?.message}
        {...register('servings')}
      />

      <TextField
        label="Instructions"
        fullWidth
        multiline
        minRows={4}
        error={Boolean(errors.instructions)}
        helperText={errors.instructions?.message}
        {...register('instructions')}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-medium text-primary">Ingredients</h3>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() =>
              append({
                ...emptyIngredient,
                unit: unitSystem === 'imperial' ? 'oz' : 'g',
              })
            }
          >
            Add ingredient
          </Button>
        </div>

        {errors.ingredients?.root?.message || errors.ingredients?.message ? (
          <Alert severity="error">
            {errors.ingredients.root?.message ?? errors.ingredients.message}
          </Alert>
        ) : null}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-2"
          >
            <TextField
              label="Name"
              fullWidth
              size="small"
              error={Boolean(errors.ingredients?.[index]?.name)}
              helperText={errors.ingredients?.[index]?.name?.message}
              {...register(`ingredients.${index}.name`)}
            />
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              size="small"
              inputProps={{ min: 0, step: 'any' }}
              error={Boolean(errors.ingredients?.[index]?.quantity)}
              helperText={errors.ingredients?.[index]?.quantity?.message}
              {...register(`ingredients.${index}.quantity`)}
            />
            <Controller
              name={`ingredients.${index}.unit`}
              control={control}
              render={({ field: unitField }) => (
                <TextField
                  {...unitField}
                  label="Unit"
                  select
                  fullWidth
                  size="small"
                  error={Boolean(errors.ingredients?.[index]?.unit)}
                  helperText={errors.ingredients?.[index]?.unit?.message}
                >
                  {unitOptions.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name={`ingredients.${index}.category`}
              control={control}
              render={({ field: categoryField }) => (
                <TextField
                  {...categoryField}
                  label="Category"
                  select
                  fullWidth
                  size="small"
                  error={Boolean(errors.ingredients?.[index]?.category)}
                  helperText={errors.ingredients?.[index]?.category?.message}
                >
                  {INGREDIENT_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="text"
                color="error"
                size="small"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {mutationError ? (
        <Alert severity="error">
          Could not {isEdit ? 'update' : 'create'} recipe. Please try again.
        </Alert>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={pending}
          startIcon={
            pending ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {isEdit ? 'Save changes' : 'Create recipe'}
        </Button>
      </div>
    </form>
  );
}
