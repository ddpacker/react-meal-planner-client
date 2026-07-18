import type {
  MealPlanWeekCreate,
  PlannedMealCreate,
  PlannedMealRead,
} from '../types/mealPlan';

export const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayLabel = (typeof DAY_LABELS)[number];

export const COURSE_ROLE_LABELS = {
  starter: 'Starter',
  entree: 'Main',
  side: 'Side',
  dessert: 'Dessert',
} as const;

/** Upcoming Monday in local time — today when today is Monday. */
export function getUpcomingMonday(from: Date = new Date()): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = date.getDay(); // 0 = Sunday … 6 = Saturday
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function toIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayOrdinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** Example: "Week of July 13th" */
export function formatWeekOfTitle(monday: Date): string {
  const month = monday.toLocaleString('en-US', { month: 'long' });
  const day = monday.getDate();
  return `Week of ${month} ${day}${dayOrdinal(day)}`;
}

/** True when the user has set a real meal name (not the weekday placeholder). */
export function isFilledPlannedMeal(meal: {
  day_index: number;
  meal_name: string;
}): boolean {
  const name = meal.meal_name.trim();
  if (!name) {
    return false;
  }
  if (meal.day_index < 0 || meal.day_index > 6) {
    return name.length > 0;
  }
  return name !== DAY_LABELS[meal.day_index];
}

export function toPlannedMealCreates(meals: PlannedMealRead[]): PlannedMealCreate[] {
  return meals.map((meal) => ({
    day_index: meal.day_index,
    meal_name: meal.meal_name,
    status: meal.status === 'planned' ? 'planned' : 'draft',
    courses: meal.courses.map((course) => ({
      role: course.role,
      description: course.description,
    })),
  }));
}

export function buildNewWeekPlanBody(from: Date = new Date()): MealPlanWeekCreate {
  const start = getUpcomingMonday(from);
  const end = addDaysLocal(start, 6);
  return {
    title: formatWeekOfTitle(start),
    start_date: toIsoDateLocal(start),
    end_date: toIsoDateLocal(end),
    // Empty slots are filled later via day cards — avoid weekday placeholder names
    // so generate-recipes only runs on meals the user actually named.
    planned_meals: [],
  };
}
