import { useParams } from 'react-router-dom';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Recipe {id}</h1>
    </main>
  );
}
