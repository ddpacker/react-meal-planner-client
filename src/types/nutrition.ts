export type NutritionInfoRead = {
  id: number;
  recipe_id: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  per_serving: boolean;
  source: string;
  created_at: string;
};
