import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeForm } from '../components/RecipeForm';
import { useRecipes } from '../hooks/useRecipes';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 12;

/**
 * Recipe library with search and pagination.
 *
 * Backend GET /recipes search + pagination is still pending. Until it ships we fetch
 * the full list once and filter/paginate client-side. When the API supports `search`,
 * `page`, and `page_size`, switch `useRecipes` to pass those params and drop the
 * local filter.
 */
export default function RecipesPage() {
  const navigate = useNavigate();
  const { data: recipes, isLoading, isError } = useRecipes();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!recipes) {
      return [];
    }
    if (!debouncedSearch) {
      return recipes;
    }
    const needle = debouncedSearch.toLowerCase();
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(needle));
  }, [recipes, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const showEmptyLibrary =
    !isLoading && !isError && recipes && recipes.length === 0 && !debouncedSearch;
  const showEmptySearch =
    !isLoading && !isError && recipes && recipes.length > 0 && filtered.length === 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-background p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Recipes</h1>
          <p className="mt-1 text-sm text-secondary">
            Browse and manage your recipe library.
          </p>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateOpen(true)}
        >
          New recipe
        </Button>
      </header>

      <TextField
        label="Search recipes"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        fullWidth
        size="small"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <CircularProgress />
        </div>
      ) : null}

      {isError ? (
        <Alert severity="error">Could not load recipes. Please try again.</Alert>
      ) : null}

      {showEmptyLibrary ? (
        <div className="flex flex-col items-start gap-3 py-12">
          <p className="text-secondary">No recipes yet. Create your first recipe.</p>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setCreateOpen(true)}
          >
            New recipe
          </Button>
        </div>
      ) : null}

      {showEmptySearch ? (
        <p className="py-12 text-secondary">No recipes match your search.</p>
      ) : null}

      {!isLoading && !isError && pageItems.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pageItems.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outlined"
                color="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outlined"
                color="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>New recipe</DialogTitle>
        <DialogContent>
          <RecipeForm
            onCancel={() => setCreateOpen(false)}
            onSuccess={(created) => {
              setCreateOpen(false);
              navigate(`/recipes/${created.id}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
