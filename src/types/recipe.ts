export type IngredientRead = {
  id: number;
  name: string;
  category: string | null;
};

/** Recipe–ingredient link returned by detail endpoints. */
export type RecipeIngredientRead = {
  id: number;
  quantity: number | null;
  unit: string | null;
  ingredient: IngredientRead;
};

export type RecipeIngredientCreate = {
  name: string;
  quantity: number | null;
  unit: string | null;
  category?: string | null;
};

export type RecipeStepRead = {
  id: number;
  step_number: number;
  text: string;
};

export type RecipeStepCreate = {
  step_number: number;
  text: string;
};

/** Full recipe with ingredients — returned by detail endpoints. */
export type RecipeRead = {
  id: number;
  title: string;
  servings: number | null;
  /** @deprecated Prefer steps — kept optional for older form drafts. */
  instructions?: string;
  /** null for manually created recipes; AI model name for generated ones. */
  source_model: string | null;
  ingredients: RecipeIngredientRead[];
  steps: RecipeStepRead[];
  created_at: string;
};

/** List item without ingredients — returned by GET /recipes. */
export type RecipeSummaryRead = {
  id: number;
  title: string;
  servings: number | null;
  source_model: string | null;
  created_at: string;
};

export type RecipeCreate = {
  title: string;
  servings?: number | null;
  instructions?: string;
  ingredients: RecipeIngredientCreate[];
  steps?: RecipeStepCreate[];
};

export type RecipeUpdate = {
  title?: string;
  servings?: number | null;
  instructions?: string;
  ingredients?: RecipeIngredientCreate[];
  steps?: RecipeStepCreate[];
};
