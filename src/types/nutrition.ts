export type MicroNutrientRead = {
  nutrient_id: number;
  name: string;
  unit: string;
  amount: number;
};

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
  micro_nutrients_json: MicroNutrientRead[] | null;
  per_serving: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
};
