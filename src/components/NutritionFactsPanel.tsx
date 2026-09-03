import { Alert, Button, CircularProgress } from '@mui/material';
import {
  useGenerateNutrition,
  useNutrition,
} from '../hooks/useRecipes';
import { formatMacro } from '../lib/formatNutrition';
import type { NutritionInfoRead } from '../types/nutrition';

type NutritionFactsPanelProps = {
  recipeId: number;
  servings: number | null;
};

type MacroRowProps = {
  label: string;
  value: string;
  indented?: boolean;
  bold?: boolean;
};

function MacroRow({ label, value, indented = false, bold = false }: MacroRowProps) {
  return (
    <div
      className={`flex items-baseline justify-between border-t border-primary py-1 ${
        indented ? 'pl-4' : ''
      } ${bold ? 'font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function NutritionLabel({
  nutrition,
  servings,
}: {
  nutrition: NutritionInfoRead;
  servings: number | null;
}) {
  const servingLine = nutrition.per_serving
    ? servings != null
      ? `Per serving (${servings} serving${servings === 1 ? '' : 's'} total)`
      : 'Per serving'
    : 'Per recipe';

  const micros = nutrition.micro_nutrients_json ?? [];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
      <div
        className="w-full max-w-sm shrink-0 border-2 border-primary bg-background p-3 text-primary"
        aria-label="Nutrition facts"
      >
        <h3 className="border-b-8 border-primary pb-1 text-2xl font-extrabold leading-tight">
          Nutrition Facts
        </h3>
        <p className="border-b border-primary py-1 text-sm">{servingLine}</p>
        <div className="flex items-end justify-between border-b-4 border-primary py-2">
          <span className="text-lg font-bold">Calories</span>
          <span className="text-3xl font-extrabold leading-none">
            {formatMacro(nutrition.calories)}
          </span>
        </div>
        <MacroRow label="Total Fat" value={formatMacro(nutrition.fat_g, 'g')} bold />
        <MacroRow
          label="Total Carbohydrate"
          value={formatMacro(nutrition.carbs_g, 'g')}
          bold
        />
        <MacroRow
          label="Dietary Fiber"
          value={formatMacro(nutrition.fiber_g, 'g')}
          indented
        />
        <MacroRow
          label="Total Sugars"
          value={formatMacro(nutrition.sugar_g, 'g')}
          indented
        />
        <MacroRow
          label="Protein"
          value={formatMacro(nutrition.protein_g, 'g')}
          bold
        />
        <MacroRow
          label="Sodium"
          value={formatMacro(nutrition.sodium_mg, 'mg')}
          bold
        />
        {nutrition.source ? (
          <p className="mt-2 border-t border-primary pt-2 text-xs text-secondary">
            Estimated from {nutrition.source.toUpperCase()} data. Values may be
            incomplete when ingredients lack a mass or volume unit.
          </p>
        ) : null}
      </div>

      {micros.length > 0 ? (
        <section
          className="relative flex max-h-96 w-full max-w-sm flex-col overflow-hidden md:max-h-none md:min-h-0 md:w-96 md:flex-none md:self-stretch"
          aria-label="Other nutrients"
        >
          {/* Absolute fill on md so this column matches the facts box height without growing the row. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:absolute md:inset-0">
            <h4 className="shrink-0 text-sm font-medium text-primary">
              Other nutrients
            </h4>
            <ul className="min-h-0 flex-1 overflow-y-auto border border-border px-2 text-sm text-secondary">
              {micros.map((micro) => (
                <li
                  key={micro.nutrient_id}
                  className="flex items-baseline justify-between gap-2 border-b border-border py-1.5 last:border-b-0"
                >
                  <span>{micro.name}</span>
                  <span className="shrink-0">
                    {formatMacro(micro.amount)} {micro.unit.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function NutritionFactsPanel({
  recipeId,
  servings,
}: NutritionFactsPanelProps) {
  const { data, isLoading, isError, refetch } = useNutrition(recipeId);
  const generateNutrition = useGenerateNutrition();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CircularProgress />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3">
        <Alert severity="error">Could not load nutrition for this recipe.</Alert>
        <Button
          variant="outlined"
          color="primary"
          className="w-fit"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (data == null) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-secondary">
          Nutrition has not been calculated for this recipe yet.
        </p>
        {generateNutrition.isError ? (
          <Alert severity="error">Could not calculate nutrition. Please try again.</Alert>
        ) : null}
        <Button
          variant="contained"
          color="primary"
          className="w-fit"
          disabled={generateNutrition.isPending}
          onClick={() => generateNutrition.mutate(recipeId)}
        >
          {generateNutrition.isPending ? 'Calculating…' : 'Calculate nutrition'}
        </Button>
      </div>
    );
  }

  return <NutritionLabel nutrition={data} servings={servings} />;
}
