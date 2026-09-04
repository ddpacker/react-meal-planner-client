import type {
  MealPlanWeekCreate,
  MealPlanWeekSummaryRead,
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

/** How many weeks ahead of the current week the user may plan (inclusive of +4). */
export const MAX_WEEKS_AHEAD = 4;

/** Monday of the week containing `from` (local time). */
export function getMondayOfWeek(from: Date = new Date()): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = date.getDay(); // 0 = Sunday … 6 = Saturday
  const daysFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysFromMonday);
  return date;
}

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

export function buildWeekPlanBody(monday: Date): MealPlanWeekCreate {
  const start = getMondayOfWeek(monday);
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

/** @deprecated Prefer buildWeekPlanBody(getMondayOfWeek(from)) for current-week creates. */
export function buildNewWeekPlanBody(from: Date = new Date()): MealPlanWeekCreate {
  return buildWeekPlanBody(getUpcomingMonday(from));
}

export type MealPlanCarouselSlot = {
  mondayIso: string;
  title: string;
  plan: MealPlanWeekSummaryRead | null;
  isCurrentWeek: boolean;
};

/**
 * Past retained plans (ascending by Monday) plus virtual slots for current week
 * through MAX_WEEKS_AHEAD. Empty past weeks are omitted.
 */
export function buildCarouselSlots(
  plans: MealPlanWeekSummaryRead[],
  today: Date = new Date(),
): MealPlanCarouselSlot[] {
  const currentMonday = getMondayOfWeek(today);
  const currentIso = toIsoDateLocal(currentMonday);
  const byStart = new Map(plans.map((plan) => [plan.start_date, plan]));

  const pastSlots: MealPlanCarouselSlot[] = plans
    .filter((plan) => plan.start_date < currentIso)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .map((plan) => {
      const monday = parseIsoDateLocal(plan.start_date);
      return {
        mondayIso: plan.start_date,
        title: formatWeekOfTitle(monday),
        plan,
        isCurrentWeek: false,
      };
    });

  const forwardSlots: MealPlanCarouselSlot[] = [];
  for (let week = 0; week <= MAX_WEEKS_AHEAD; week += 1) {
    const monday = addDaysLocal(currentMonday, week * 7);
    const mondayIso = toIsoDateLocal(monday);
    forwardSlots.push({
      mondayIso,
      title: formatWeekOfTitle(monday),
      plan: byStart.get(mondayIso) ?? null,
      isCurrentWeek: week === 0,
    });
  }

  return [...pastSlots, ...forwardSlots];
}

function parseIsoDateLocal(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}
