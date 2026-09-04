import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
const CARD_GAP = 60;
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

function cardCenterY(index: number): number {
  return EDGE_PAD + index * SLOT_STRIDE + CARD_HEIGHT / 2;
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
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [slots.length]);

  return (
    <div
      ref={scrollerRef}
      className="scrollbar-none -mx-16 h-[min(70vh,560px)] overflow-y-auto overscroll-contain px-16 [scroll-snap-type:y_mandatory] [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)]"
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
              className="absolute left-0 right-0 [scroll-snap-align:center]"
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
                onActivate={onActivate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
