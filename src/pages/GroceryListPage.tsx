import { useParams } from 'react-router-dom';

export default function GroceryListPage() {
  const { listId } = useParams<{ listId: string }>();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Grocery list {listId}</h1>
    </main>
  );
}
