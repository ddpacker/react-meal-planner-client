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
  rotateX: number;
  scale: number;
  translateY: number;
  translateZ: number;
  zIndex: number;
};

const CARD_HEIGHT = 120;
const CARD_GAP = 12;
const SLOT_STRIDE = CARD_HEIGHT + CARD_GAP;
/** Vertical padding so the first/last card can sit in the viewport center. */
const EDGE_PAD = 180;
/** Pull outer cards toward center (px per step beyond the adjacent ring). */
const OUTER_INSET_PX = 28;

function transformsForOffset(offsetPx: number): CardTransform {
  const steps = offsetPx / SLOT_STRIDE;
  const absSteps = Math.abs(steps);
  const sign = Math.sign(steps) || 1;

  // Smaller cylinder radius: gentle near center (cards 2/4), steeper at rim (1/5).
  let rotateX: number;
  if (absSteps <= 1) {
    rotateX = steps * -11;
  } else {
    rotateX = sign * -(11 + (absSteps - 1) * 42);
  }

  // Draw 1 and 5 inward so they sit closer to 2 and 4.
  const translateY =
    absSteps > 1 ? -sign * (absSteps - 1) * OUTER_INSET_PX : 0;

  // Gradual fade: center solid, 2/4 slightly soft, 1/5 much dimmer.
  let opacity: number;
  if (absSteps <= 1) {
    opacity = 1 - absSteps * 0.22;
  } else if (absSteps <= 2.25) {
    opacity = 0.78 - (absSteps - 1) * 0.4;
  } else {
    opacity = Math.max(0, 0.28 - (absSteps - 2.25) * 0.35);
  }

  // Center card stacks above neighbors so their shadows fall behind it.
  const translateZ = Math.max(0, 72 - absSteps * 36);
  const zIndex = Math.round(100 - absSteps * 20);

  return {
    opacity,
    rotateX: Math.max(-62, Math.min(62, rotateX)),
    scale: absSteps <= 1 ? 1 - absSteps * 0.035 : Math.max(0.7, 1 - absSteps * 0.09),
    translateY,
    translateZ,
    zIndex,
  };
}

const DEFAULT_TRANSFORM: CardTransform = {
  opacity: 1,
  rotateX: 0,
  scale: 1,
  translateY: 0,
  translateZ: 0,
  zIndex: 0,
};

export function MealPlanCarousel({
  slots,
  busyMondayIso = null,
  onActivate,
}: MealPlanCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [transforms, setTransforms] = useState<CardTransform[]>(() =>
    slots.map(() => ({ ...DEFAULT_TRANSFORM })),
  );
  const didInitialScroll = useRef(false);

  const updateTransforms = () => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const viewportCenter = scroller.scrollTop + scroller.clientHeight / 2;
    const next = itemRefs.current.map((el) => {
      if (!el) {
        return { ...DEFAULT_TRANSFORM };
      }
      const cardCenter = el.offsetTop + el.offsetHeight / 2;
      return transformsForOffset(cardCenter - viewportCenter);
    });
    setTransforms(next);
  };

  useLayoutEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, slots.length);
    if (!didInitialScroll.current && scrollerRef.current) {
      const currentIndex = slots.findIndex((slot) => slot.isCurrentWeek);
      if (currentIndex >= 0) {
        const targetTop = EDGE_PAD + currentIndex * SLOT_STRIDE - scrollerRef.current.clientHeight / 2 + CARD_HEIGHT / 2;
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
      className="scrollbar-none -mx-16 h-[min(70vh,560px)] overflow-y-auto overscroll-contain px-16 [perspective:900px] [scroll-snap-type:y_mandatory] [mask-image:linear-gradient(to_bottom,transparent_0%,black_16%,black_84%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_16%,black_84%,transparent_100%)]"
      aria-label="Meal plan weeks"
    >
      <div
        className="flex w-full flex-col"
        style={{
          paddingTop: EDGE_PAD,
          paddingBottom: EDGE_PAD,
          gap: CARD_GAP,
          transformStyle: 'preserve-3d',
        }}
      >
        {slots.map((slot, index) => {
          const t = transforms[index] ?? DEFAULT_TRANSFORM;
          return (
            <div
              key={slot.mondayIso}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="relative shrink-0 [scroll-snap-align:center]"
              style={{
                height: CARD_HEIGHT,
                opacity: t.opacity,
                zIndex: t.zIndex,
                transform: `translateZ(${t.translateZ}px) translateY(${t.translateY}px) rotateX(${t.rotateX}deg) scale(${t.scale})`,
                transformOrigin: 'center center',
                willChange: 'transform, opacity',
              }}
            >
              <MealPlanWeekCard
                slot={slot}
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
