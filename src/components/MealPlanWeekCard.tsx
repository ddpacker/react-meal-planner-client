import type { MealPlanCarouselSlot } from '../lib/mealPlanDays';

type MealPlanWeekCardProps = {
  slot: MealPlanCarouselSlot;
  disabled?: boolean;
  onActivate: (slot: MealPlanCarouselSlot) => void;
};

function statusLabel(slot: MealPlanCarouselSlot): string {
  if (!slot.plan) {
    return 'Not started';
  }
  const count = slot.plan.meal_count;
  if (count <= 0) {
    return 'No meals yet';
  }
  return `${count} meal${count === 1 ? '' : 's'}`;
}

export function MealPlanWeekCard({
  slot,
  disabled = false,
  onActivate,
}: MealPlanWeekCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onActivate(slot)}
      className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border bg-paper px-6 py-5 text-left transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
      style={{ transformStyle: 'preserve-3d' }}
      aria-label={`${slot.title}. ${statusLabel(slot)}`}
    >
      <span className="text-lg font-medium text-primary">{slot.title}</span>
      <span className="text-sm text-secondary">{statusLabel(slot)}</span>
      {slot.isCurrentWeek ? (
        <span className="text-xs font-medium uppercase tracking-wide text-secondary">
          Current week
        </span>
      ) : null}
    </button>
  );
}
