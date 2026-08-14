import { Button } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';

export default function GroceryListPage() {
  const { listId } = useParams<{ listId: string }>();

  if (!listId) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-primary">Grocery list</h1>
        <p className="text-secondary">
          No list selected. Open a meal plan to view or generate its grocery list.
        </p>
        <Button component={RouterLink} to="/" variant="outlined" color="primary">
          Back to meal plans
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-primary">Grocery list {listId}</h1>
    </div>
  );
}
