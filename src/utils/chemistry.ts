export const CHEMISTRY_COLORS = {
  optimal: "var(--chem-optimal)",
  good: "var(--chem-good)",
  weak: "var(--chem-weak)",
  bad: "var(--chem-bad)",
} as const;

export const CHEMISTRY_STROKE = {
  optimal: 2.5,
  good: 2.0,
  weak: 1.8,
  bad: 2.0,
} as const;

export const CHEMISTRY_OPACITY = {
  optimal: 0.85,
  good: 0.75,
  weak: 0.70,
  bad: 0.80,
} as const;
