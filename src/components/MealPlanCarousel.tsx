import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { MealPlanWeekCard } from './MealPlanWeekCard';
import type { MealPlanCarouselSlot } from '../lib/mealPlanDays';

type MealPlanCarouselProps = {
  slots: MealPlanCarouselSlot[];
  busyMondayIso?: string | null;
  onActivate: (slot: MealPlanCarouselSlot) => void;
};

type CardTransform = {
  opacity: number;
  angleDeg: number;
  /** Distance from focus in slot strides — drives shadow strength. */
  depth: number;
  /** -1 above center, 0 at focus, +1 below — shadow casts away from focus. */
  side: number;
  zIndex: number;
};

const CARD_HEIGHT = 120;
/** Small seam between faces on the cylinder (not flush, not a wide gutter). */
const CARD_GAP = 10;
const SLOT_STRIDE = CARD_HEIGHT + CARD_GAP;
/** Vertical padding so the first/last card can sit in the viewport center. */
const EDGE_PAD = 200;
/**
 * Degrees between adjacent slots on the wheel. Higher = tighter cylinder
 * (more squash at the rim). Prior sweet spot was 20 — revert here if needed.
 */
const ANGLE_STEP_DEG = 28;
const CYLINDER_RADIUS = SLOT_STRIDE / (ANGLE_STEP_DEG * (Math.PI / 180));
const PERSPECTIVE_PX = 1200;
/** Depth below which a card counts as the focused (center) face. */
const FOCUS_DEPTH = 0.45;
const SCROLL_MS_PER_SLOT = 320;
const SCROLL_MS_MIN = 500;
const SCROLL_MS_MAX = 1100;
/** Wait after the last scroll event before easing to the nearest card. */
const SETTLE_DEBOUNCE_MS = 120;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Custom scroll so duration can be slower than the browser's `behavior: 'smooth'`. */
function animateScrollY(
  el: HTMLElement,
  targetTop: number,
  durationMs: number,
  onDone?: () => void,
): () => void {
  const startTop = el.scrollTop;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 1 || durationMs <= 0) {
    el.scrollTop = targetTop;
    onDone?.();
    return () => {};
  }

  const startTime = performance.now();
  let frame = 0;
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) {
      return;
    }
    const t = Math.min(1, (now - startTime) / durationMs);
    el.scrollTop = startTop + delta * easeInOutCubic(t);
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  };

  frame = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}

function cardCenterY(index: number): number {
  return EDGE_PAD + index * SLOT_STRIDE + CARD_HEIGHT / 2;
}

function nearestSlotIndex(viewportCenterY: number, slotCount: number): number {
  const raw = (viewportCenterY - EDGE_PAD - CARD_HEIGHT / 2) / SLOT_STRIDE;
  return Math.max(0, Math.min(slotCount - 1, Math.round(raw)));
}

function scrollDurationMs(distancePx: number): number {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 0;
  }
  const slotsAway = Math.abs(distancePx) / SLOT_STRIDE;
  return Math.min(
    SCROLL_MS_MAX,
    Math.max(SCROLL_MS_MIN, slotsAway * SCROLL_MS_PER_SLOT),
  );
}

function transformsForOffset(offsetPx: number): CardTransform {
  const thetaRad = offsetPx / CYLINDER_RADIUS;
  const absSteps = Math.abs(offsetPx / SLOT_STRIDE);

  let opacity: number;
  if (absSteps <= 1) {
    opacity = 1 - absSteps * 0.18;
  } else if (absSteps <= 2.25) {
    opacity = 0.82 - (absSteps - 1) * 0.35;
  } else {
    opacity = Math.max(0, 0.35 - (absSteps - 2.25) * 0.3);
  }

  return {
    // Negative so cards below center travel down the cylinder (not tip forward).
    angleDeg: (-thetaRad * 180) / Math.PI,
    depth: absSteps,
    side: Math.sign(offsetPx),
    opacity,
    zIndex: Math.round(100 - absSteps * 20),
  };
}

const DEFAULT_TRANSFORM: CardTransform = {
  opacity: 1,
  angleDeg: 0,
  depth: 0,
  side: 0,
  zIndex: 0,
};

export function MealPlanCarousel({
  slots,
  busyMondayIso = null,
  onActivate,
}: MealPlanCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [transforms, setTransforms] = useState<CardTransform[]>(() =>
    slots.map(() => ({ ...DEFAULT_TRANSFORM })),
  );
  const [focusOffsetY, setFocusOffsetY] = useState(0);
  const didInitialScroll = useRef(false);
  const cancelScrollAnim = useRef<(() => void) | null>(null);
  const isAnimatingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slotsCountRef = useRef(slots.length);
  const focusedIndexRef = useRef(0);
  slotsCountRef.current = slots.length;

  const clearSettleTimer = () => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const scrollToIndex = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller || slotsCountRef.current === 0) {
      return;
    }

    clearSettleTimer();
    cancelScrollAnim.current?.();

    const clamped = Math.max(0, Math.min(slotsCountRef.current - 1, index));
    focusedIndexRef.current = clamped;
    const targetTop = Math.max(0, cardCenterY(clamped) - scroller.clientHeight / 2);
    const durationMs = scrollDurationMs(targetTop - scroller.scrollTop);

    isAnimatingRef.current = true;
    const finish = () => {
      isAnimatingRef.current = false;
      cancelScrollAnim.current = null;
    };
    const cancel = animateScrollY(scroller, targetTop, durationMs, finish);
    cancelScrollAnim.current = () => {
      cancel();
      finish();
    };
  };

  const settleToNearest = () => {
    if (isAnimatingRef.current) {
      return;
    }
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const viewportCenter = scroller.scrollTop + scroller.clientHeight / 2;
    const index = nearestSlotIndex(viewportCenter, slotsCountRef.current);
    focusedIndexRef.current = index;
    const targetTop = Math.max(0, cardCenterY(index) - scroller.clientHeight / 2);
    if (Math.abs(scroller.scrollTop - targetTop) < 1) {
      return;
    }
    scrollToIndex(index);
  };

  useEffect(() => {
    return () => {
      clearSettleTimer();
      cancelScrollAnim.current?.();
    };
  }, []);

  const updateTransforms = () => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const viewportCenter = scroller.scrollTop + scroller.clientHeight / 2;
    setFocusOffsetY(viewportCenter);
    setTransforms(
      slots.map((_, index) =>
        transformsForOffset(cardCenterY(index) - viewportCenter),
      ),
    );
  };

  useLayoutEffect(() => {
    if (!didInitialScroll.current && scrollerRef.current) {
      const currentIndex = slots.findIndex((slot) => slot.isCurrentWeek);
      if (currentIndex >= 0) {
        focusedIndexRef.current = currentIndex;
        const targetTop =
          cardCenterY(currentIndex) - scrollerRef.current.clientHeight / 2;
        scrollerRef.current.scrollTop = Math.max(0, targetTop);
      }
      didInitialScroll.current = true;
    }
    updateTransforms();
  }, [slots]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    let frame = 0;

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateTransforms);
      if (isAnimatingRef.current) {
        return;
      }
      clearSettleTimer();
      settleTimerRef.current = setTimeout(settleToNearest, SETTLE_DEBOUNCE_MS);
    };

    // Let the user take over if they scroll during a programmatic ease.
    const interruptAnimation = () => {
      if (!isAnimatingRef.current) {
        return;
      }
      cancelScrollAnim.current?.();
      clearSettleTimer();
      settleTimerRef.current = setTimeout(settleToNearest, SETTLE_DEBOUNCE_MS);
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('wheel', interruptAnimation, { passive: true });
    scroller.addEventListener('touchstart', interruptAnimation, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      clearSettleTimer();
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('wheel', interruptAnimation);
      scroller.removeEventListener('touchstart', interruptAnimation);
      window.removeEventListener('resize', onScroll);
    };
  }, [slots.length]);

  const handleCardClick = (slot: MealPlanCarouselSlot, index: number, depth: number) => {
    // Only open/create when the card is already at the wheel focus.
    if (depth < FOCUS_DEPTH) {
      onActivate(slot);
      return;
    }
    scrollToIndex(index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }
    event.preventDefault();
    // Keep focus on the scroller so repeated arrows don't stick on an off-center card.
    scrollerRef.current?.focus({ preventScroll: true });
    const delta = event.key === 'ArrowUp' ? -1 : 1;
    scrollToIndex(focusedIndexRef.current + delta);
  };

  return (
    <div
      ref={scrollerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="scrollbar-none -mx-16 h-[min(70vh,560px)] overflow-y-auto overscroll-contain px-16 outline-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ perspective: `${PERSPECTIVE_PX}px`, perspectiveOrigin: '50% 50%' }}
      aria-label="Meal plan weeks"
    >
      <div
        className="relative w-full"
        style={{
          height: EDGE_PAD * 2 + slots.length * SLOT_STRIDE - CARD_GAP,
          transformStyle: 'preserve-3d',
          // Keep the front of the wheel near the screen plane.
          transform: `translateZ(${-CYLINDER_RADIUS}px)`,
        }}
      >
        {[...slots]
          .map((slot, index) => ({ slot, index, t: transforms[index] ?? DEFAULT_TRANSFORM }))
          // Furthest first so the focused card paints on top if depth-sort falters.
          .sort((a, b) => b.t.depth - a.t.depth)
          .map(({ slot, index, t }) => {
          const offsetPx = cardCenterY(index) - focusOffsetY;
          return (
            <div
              key={slot.mondayIso}
              className="absolute left-0 right-0"
              style={{
                top: cardCenterY(index) - CARD_HEIGHT / 2,
                height: CARD_HEIGHT,
                zIndex: t.zIndex,
                // Move to wheel axis (viewport center), rotate, push out to rim.
                transform: `translateY(${-offsetPx}px) rotateX(${t.angleDeg}deg) translateZ(${CYLINDER_RADIUS}px)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                willChange: 'transform',
              }}
            >
              <MealPlanWeekCard
                slot={slot}
                depth={t.depth}
                side={t.side}
                fade={t.opacity}
                disabled={busyMondayIso === slot.mondayIso}
                onActivate={() => handleCardClick(slot, index, t.depth)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
