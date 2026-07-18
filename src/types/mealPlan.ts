export type MealCourseRole = 'starter' | 'entree' | 'side' | 'dessert';

export type PlannedMealStatus = 'draft' | 'planned';

export type PlannedMealCourseCreate = {
  role: MealCourseRole;
  description?: string | null;
};

export type PlannedMealCourseRead = {
  id: number;
  role: MealCourseRole;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PlannedMealCourseUpsert = {
  id?: number | null;
  role: MealCourseRole;
  description?: string | null;
};

export type PlannedMealRecipeRead = {
  id: number;
  planned_meal_id: number;
  planned_meal_course_id: number;
  recipe_id: number;
  role: MealCourseRole;
  /** Present when the API embeds recipe summary; otherwise link by recipe_id only. */
  recipe_title?: string | null;
};

export type PlannedMealCreate = {
  day_index: number;
  meal_name: string;
  status?: PlannedMealStatus;
  courses?: PlannedMealCourseCreate[] | null;
};

export type PlannedMealRead = {
  id: number;
  day_index: number;
  meal_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  courses: PlannedMealCourseRead[];
  /** Pending backend nesting — optional until recipe links ship on plan reads. */
  recipes?: PlannedMealRecipeRead[];
};

export type PlannedMealUpdate = {
  meal_name?: string;
  status?: PlannedMealStatus;
  courses?: PlannedMealCourseUpsert[] | null;
};

export type MealPlanWeekCreate = {
  start_date: string;
  end_date: string;
  title?: string | null;
  planned_meals?: PlannedMealCreate[];
};

export type MealPlanWeekUpdate = {
  title?: string | null;
  planned_meals?: PlannedMealCreate[] | null;
};

export type MealPlanWeekRead = {
  id: number;
  start_date: string;
  end_date: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  planned_meals: PlannedMealRead[];
  /** Pending backend support — treat as optional. */
  meal_count?: number;
  /** Pending backend support — treat as optional. */
  has_grocery_list?: boolean;
  /** Pending backend support — needed to link to /grocery/:listId. */
  grocery_list_id?: number | null;
};
