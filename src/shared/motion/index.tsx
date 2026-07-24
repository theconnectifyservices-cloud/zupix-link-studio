/**
 * Unified motion primitives for the landing experience.
 * All animations respect `prefers-reduced-motion` and share
 * one spring/timing system.
 */
import {
  motion,
  useReducedMotion,
  useInView,
  useMotionValue,
  useSpring,
  type Variants,
  type HTMLMotionProps,
} from "motion/react";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export const SPRING = { type: "spring" as const, stiffness: 260, damping: 26, mass: 0.6 };
export const EASE = [0.22, 1, 0.36, 1] as const;

/* -------------------------------------------------------------------------- */
/*  Reveal — fade / slide / scale / blur on scroll (once)                     */
/* -------------------------------------------------------------------------- */

type RevealVariant = "fade" | "slide-up" | "slide-left" | "scale" | "blur";

const variantsFor = (v: RevealVariant): Variants => {
  const base: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.7, ease: EASE } },
  };
  switch (v) {
    case "slide-up":
      return {
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };
    case "slide-left":
      return {
        hidden: { opacity: 0, x: 28 },
        show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
      };
    case "scale":
      return {
        hidden: { opacity: 0, scale: 0.94 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
      };
    case "blur":
      return {
        hidden: { opacity: 0, filter: "blur(12px)" },
        show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
      };
    default:
      return base;
  }
};

export function Reveal({
  children,
  variant = "slide-up",
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "span" | "li";
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const MotionTag = motion[as] as typeof motion.div;

  if (reduced) {
    const Tag = as as "div";
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={variantsFor(variant)}
      transition={{ delay }}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Magnetic — subtle cursor-follow used on premium CTAs / cards              */
/* -------------------------------------------------------------------------- */

export function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shine — sweeping highlight for premium buttons/cards                      */
/* -------------------------------------------------------------------------- */

export function Shine({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group relative isolate overflow-hidden", className)}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tilt — 3D hover for theme/preview cards                                   */
/* -------------------------------------------------------------------------- */

export function Tilt({
  children,
  className,
  max = 8,
  ...props
}: {
  children: ReactNode;
  className?: string;
  max?: number;
} & Omit<HTMLMotionProps<"div">, "ref" | "children">) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
