/** 4-pt spacing grid, radii, layout widths, motion + touch constants. */

export const SPACE = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const RADII = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, "2xl": 28, pill: 999 } as const;

/** Min touch target (WCAG 2.5.5 / platform guidance). */
export const TOUCH = { min: 44, row: 56 } as const;

/** Viewport-width breakpoints (px). */
export const BREAKPOINTS = {
  /** below this, course grid is 1 column */
  smallPhone: 380,
  /** ≥ this, web/tablet type scale + sidebar TOC kick in */
  wide: 768,
  /** ≥ this, course grid is 3 columns */
  desktop: 1024,
} as const;

export const LAYOUT = {
  /** Comfortable reading measure (~65-75 chars) — reader content max width. */
  readingMaxWidth: 720,
  /** Sticky TOC sidebar width on wide screens. */
  tocWidth: 240,
  /** Outer page max width for grids/lists on huge monitors. */
  pageMaxWidth: 1180,
  gutter: { phone: 16, wide: 24 },
} as const;

/** Course-grid column count for a viewport width: 1 → small phones, 2 → phones/tablets, 3 → wide web. */
export function gridColumns(width: number): 1 | 2 | 3 {
  if (width >= BREAKPOINTS.desktop) return 3;
  if (width >= BREAKPOINTS.smallPhone) return 2;
  return 1;
}

export const isWide = (width: number) => width >= BREAKPOINTS.wide;

/** Motion budget — "subtle, nothing flashy or slow". */
export const MOTION = {
  press: 120,
  enter: 260,
  enterOffset: 14,
  stagger: 50,
  accordion: 240,
  /** Cap stagger so a long list never delays the last row noticeably. */
  maxStaggerIndex: 8,
  pressedScale: 0.97,
} as const;

/** Vertical rhythm inside the reader (spec: 32 above H2, 20 above H3, 16 between paragraphs). */
export const READER_SPACING = {
  paragraph: 16,
  h2Top: 32,
  h3Top: 20,
  h4Top: 16,
  headingBottom: 10,
  listItem: 9,
  block: 20,
} as const;
