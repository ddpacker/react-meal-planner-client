import { describe, expect, it } from 'vitest';
import {
  buildCarouselSlots,
  buildNewWeekPlanBody,
  buildWeekPlanBody,
  formatWeekOfTitle,
  getMondayOfWeek,
  getUpcomingMonday,
  isFilledPlannedMeal,
  toIsoDateLocal,
} from '../../lib/mealPlanDays';
import type { MealPlanWeekSummaryRead } from '../../types/mealPlan';

function summary(
  overrides: Partial<MealPlanWeekSummaryRead> & Pick<MealPlanWeekSummaryRead, 'start_date'>,
): MealPlanWeekSummaryRead {
  return {
    id: 1,
    title: null,
    end_date: '2026-07-19',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    meal_count: 0,
    has_grocery_list: false,
    ...overrides,
  };
}

describe('mealPlanDays helpers', () => {
  it('returns today when today is Monday for upcoming Monday', () => {
    const monday = new Date(2026, 6, 13); // Jul 13 2026
    expect(toIsoDateLocal(getUpcomingMonday(monday))).toBe('2026-07-13');
    expect(formatWeekOfTitle(monday)).toBe('Week of July 13th');
  });

  it('returns the next Monday when today is not Monday', () => {
    const tuesday = new Date(2026, 6, 14);
    expect(toIsoDateLocal(getUpcomingMonday(tuesday))).toBe('2026-07-20');
    expect(formatWeekOfTitle(getUpcomingMonday(tuesday))).toBe('Week of July 20th');
  });

  it('floors to Monday of the containing week', () => {
    const thursday = new Date(2026, 6, 16);
    expect(toIsoDateLocal(getMondayOfWeek(thursday))).toBe('2026-07-13');
    expect(toIsoDateLocal(getMondayOfWeek(new Date(2026, 6, 19)))).toBe('2026-07-13'); // Sunday
  });

  it('builds a create body for a given Monday', () => {
    const body = buildWeekPlanBody(new Date(2026, 6, 13));
    expect(body.title).toBe('Week of July 13th');
    expect(body.start_date).toBe('2026-07-13');
    expect(body.end_date).toBe('2026-07-19');
    expect(body.planned_meals).toEqual([]);
  });

  it('builds a create body with no placeholder meals via legacy helper', () => {
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

  it('builds carousel slots with past plans and five forward weeks', () => {
    const today = new Date(2026, 6, 16); // Thursday → current week Mon Jul 13
    const slots = buildCarouselSlots(
      [
        summary({ id: 1, start_date: '2026-06-29', end_date: '2026-07-05', meal_count: 2 }),
        summary({ id: 2, start_date: '2026-07-13', end_date: '2026-07-19', meal_count: 3 }),
        summary({ id: 3, start_date: '2026-07-20', end_date: '2026-07-26', meal_count: 0 }),
      ],
      today,
    );

    expect(slots.map((s) => s.mondayIso)).toEqual([
      '2026-06-29',
      '2026-07-13',
      '2026-07-20',
      '2026-07-27',
      '2026-08-03',
      '2026-08-10',
    ]);
    expect(slots[0].plan?.id).toBe(1);
    expect(slots[1].isCurrentWeek).toBe(true);
    expect(slots[1].title).toBe('Week of July 13th');
    expect(slots[1].plan?.meal_count).toBe(3);
    expect(slots[3].plan).toBeNull();
    expect(slots[3].title).toBe('Week of July 27th');
  });

  it('omits empty past weeks from carousel slots', () => {
    const today = new Date(2026, 6, 13);
    const slots = buildCarouselSlots([], today);
    expect(slots).toHaveLength(5);
    expect(slots.every((s) => s.mondayIso >= '2026-07-13')).toBe(true);
    expect(slots[0].isCurrentWeek).toBe(true);
  });
});
