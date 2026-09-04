import { brandColorWithAlpha } from '../lib/theme/tokens';
import type { MealPlanCarouselSlot } from '../lib/mealPlanDays';

type MealPlanWeekCardProps = {
  slot: MealPlanCarouselSlot;
  disabled?: boolean;
  /** 0 = focused front card; higher = further back on the wheel. */
  depth?: number;
  /** -1 above focus, 0 at focus, +1 below. */
  side?: number;
  /** Fade without putting opacity on the 3D wrapper (preserves depth sort). */
  fade?: number;
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

/**
 * Center casts onto both adjacent layers (up and down) so the front card
 * reads in front on both halves. Cards above focus get no shadow — their
 * blur was bleeding onto the center and inverting the top. Cards below
 * keep a soft cast further down the wheel.
 */
function shadowForDepth(depth: number, side: number): string {
  const primary = (opacity: number) => brandColorWithAlpha('primary', opacity);

  if (depth < 0.45) {
    // Symmetric casts onto the layers behind (tight spread so blur stays off-card).
    return [
      `0 -36px 72px -20px ${primary(0.4)}`,
      `0 36px 72px -20px ${primary(0.4)}`,
      `0 -12px 12px -8px ${primary(0.14)}`,
      `0 12px 12px -8px ${primary(0.14)}`,
    ].join(', ');
  }

  // Above focus: no shadow (avoids washing the center's top edge).
  if (side < 0) {
    return 'none';
  }

  // Below focus: soft cast further down the cylinder.
  const t = Math.min(1, depth / 2);
  const y = 14 - t * 5;
  const blur = 14 - t * 3;
  return `0 ${y}px ${blur}px ${-(blur - 2)}px ${primary(0.18 - t * 0.06)}`;
}

export function MealPlanWeekCard({
  slot,
  disabled = false,
  depth = 0,
  side = 0,
  fade = 1,
  onActivate,
}: MealPlanWeekCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onActivate(slot)}
      className={`flex h-full w-full flex-col gap-2 rounded-2xl border border-border bg-paper px-6 py-5 text-left transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70 ${
        slot.isCurrentWeek
          ? 'border-l-[10px] border-l-secondary hover:border-l-secondary'
          : ''
      }`}
      style={{
        opacity: fade,
        transformStyle: 'preserve-3d',
        boxShadow: shadowForDepth(depth, side),
      }}
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
