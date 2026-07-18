import { useState, type KeyboardEvent, type MouseEvent } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useDeleteRecipe } from '../hooks/useRecipes';
import type { RecipeSummaryRead } from '../types/recipe';

type RecipeCardProps = {
  recipe: RecipeSummaryRead;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();
  const deleteRecipe = useDeleteRecipe();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openRecipe = () => {
    navigate(`/recipes/${recipe.id}`);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openRecipe();
    }
  };

  const handleDeleteClick = (event: MouseEvent) => {
    event.stopPropagation();
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (deleteRecipe.isPending) {
      return;
    }
    setConfirmOpen(false);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteRecipe.mutateAsync(recipe.id);
      setConfirmOpen(false);
    } catch {
      setDeleteError('Could not delete this recipe. Please try again.');
    }
  };

  return (
    <li
      className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-background p-4 transition hover:border-secondary"
      onClick={openRecipe}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`Open recipe ${recipe.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium text-primary">{recipe.title}</h2>
          <p className="text-sm text-secondary">
            {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
          </p>
          {recipe.source_model ? (
            <Chip
              size="small"
              label="AI-generated"
              color="secondary"
              variant="outlined"
              className="mt-1 w-fit"
            />
          ) : null}
        </div>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleDeleteClick}
        >
          Delete
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        fullWidth
        maxWidth="sm"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogTitle>Delete recipe</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <DialogContentText>
            Delete &ldquo;{recipe.title}&rdquo;? This cannot be undone.
          </DialogContentText>
          {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={deleteRecipe.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteRecipe.isPending}
            startIcon={
              deleteRecipe.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </li>
  );
}
