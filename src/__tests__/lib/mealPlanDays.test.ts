import { describe, expect, it } from 'vitest';
import {
  buildNewWeekPlanBody,
  formatWeekOfTitle,
  getUpcomingMonday,
  isFilledPlannedMeal,
  toIsoDateLocal,
} from '../../lib/mealPlanDays';

describe('mealPlanDays helpers', () => {
  it('returns today when today is Monday', () => {
    const monday = new Date(2026, 6, 13); // Jul 13 2026
    expect(toIsoDateLocal(getUpcomingMonday(monday))).toBe('2026-07-13');
    expect(formatWeekOfTitle(monday)).toBe('Week of July 13th');
  });

  it('returns the next Monday when today is not Monday', () => {
    const tuesday = new Date(2026, 6, 14);
    expect(toIsoDateLocal(getUpcomingMonday(tuesday))).toBe('2026-07-20');
    expect(formatWeekOfTitle(getUpcomingMonday(tuesday))).toBe('Week of July 20th');
  });

  it('builds a create body with no placeholder meals', () => {
    const body = buildNewWeekPlanBody(new Date(2026, 6, 13));
    expect(body.title).toBe('Week of July 13th');
    expect(body.start_date).toBe('2026-07-13');
    expect(body.end_date).toBe('2026-07-19');
    expect(body.planned_meals).toEqual([]);
  });

  it('treats weekday placeholder names as unfilled', () => {
    expect(isFilledPlannedMeal({ day_index: 0, meal_name: 'Monday' })).toBe(false);
    expect(isFilledPlannedMeal({ day_index: 0, meal_name: 'Tacos' })).toBe(true);
  });
});
