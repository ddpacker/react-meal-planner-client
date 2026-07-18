export type RecipeIngredientRead = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
};

export type RecipeIngredientCreate = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
};

/** Full recipe with ingredients — returned by detail endpoints. */
export type RecipeRead = {
  id: number;
  title: string;
  servings: number;
  instructions: string;
  /** null for manually created recipes; AI model name for generated ones. */
  source_model: string | null;
  ingredients: RecipeIngredientRead[];
  created_at: string;
};

/** List item without ingredients — returned by GET /recipes. */
export type RecipeSummaryRead = {
  id: number;
  title: string;
  servings: number;
  source_model: string | null;
  created_at: string;
};

export type RecipeCreate = {
  title: string;
  servings: number;
  instructions: string;
  ingredients: RecipeIngredientCreate[];
};

export type RecipeUpdate = {
  title?: string;
  servings?: number;
  instructions?: string;
  ingredients?: RecipeIngredientCreate[];
};
