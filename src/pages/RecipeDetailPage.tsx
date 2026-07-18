import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { RecipeForm } from '../components/RecipeForm';
import { useAuth } from '../context/AuthContext';
import { useRecipe } from '../hooks/useRecipes';
import { formatQuantity } from '../lib/formatQuantity';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const { unitSystem } = useAuth();
  const { data: recipe, isLoading, isError } = useRecipe(recipeId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <CircularProgress />
      </main>
    );
  }

  if (isError || !recipe) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-background p-6">
        <Alert severity="error">Could not load this recipe. Please try again.</Alert>
        <Button component={RouterLink} to="/recipes" variant="outlined" color="primary">
          Back to recipes
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 bg-background p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button
            component={RouterLink}
            to="/recipes"
            variant="text"
            color="secondary"
            className="w-fit px-0"
          >
            ← Recipes
          </Button>
          <h1 className="text-2xl font-semibold text-primary">{recipe.title}</h1>
          <p className="text-sm text-secondary">
            {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
          </p>
          {recipe.source_model ? (
            <Chip
              size="small"
              label="AI-generated"
              color="secondary"
              variant="outlined"
              className="w-fit"
            />
          ) : null}
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-primary">Ingredients</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-secondary">No ingredients listed.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2"
              >
                <span className="text-primary">{ingredient.name}</span>
                <span className="text-sm text-secondary">
                  {formatQuantity(ingredient.quantity, ingredient.unit, unitSystem)}
                  {ingredient.category ? (
                    <span className="ml-2 text-secondary">({ingredient.category})</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recipe.instructions ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-primary">Instructions</h2>
          <p className="whitespace-pre-wrap text-sm text-primary">{recipe.instructions}</p>
        </section>
      ) : null}

      {/* ChatInterface — see chat.plan.md */}
      <section aria-label="Recipe chat" className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-primary">Chat</h2>
        <p className="text-sm text-secondary">Chat will appear here when available.</p>
      </section>

      {/* NutritionPanel — see nutrition.plan.md */}
      <section aria-label="Recipe nutrition" className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-primary">Nutrition</h2>
        <p className="text-sm text-secondary">Nutrition will appear here when available.</p>
      </section>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Edit recipe</DialogTitle>
        <DialogContent>
          <RecipeForm
            recipe={recipe}
            onCancel={() => setEditOpen(false)}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
