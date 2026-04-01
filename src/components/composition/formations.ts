/** Formation definitions — positions as % of pitch (x, y from top-left) */

export interface FormationPosition {
  label: string; // e.g. "GK", "CB", "CM"
  x: number;     // % from left
  y: number;     // % from top (0 = goal line)
}

export interface Formation {
  name: string;
  positions: FormationPosition[];
  /** Pairs of indices that are connected for chemistry */
  links: [number, number][];
}

export const FORMATIONS: Record<string, Formation> = {
  "4-3-3": {
    name: "4-3-3",
    positions: [
      { label: "GK", x: 50, y: 92 },
      { label: "LB", x: 15, y: 72 },
      { label: "CB", x: 38, y: 76 },
      { label: "CB", x: 62, y: 76 },
      { label: "RB", x: 85, y: 72 },
      { label: "CM", x: 25, y: 52 },
      { label: "CM", x: 50, y: 48 },
      { label: "CM", x: 75, y: 52 },
      { label: "LW", x: 18, y: 24 },
      { label: "ST", x: 50, y: 18 },
      { label: "RW", x: 82, y: 24 },
    ],
    links: [
      [0, 2], [0, 3],
      [1, 2], [2, 3], [3, 4],
      [1, 5], [5, 6], [6, 7], [4, 7],
      [5, 8], [6, 9], [7, 10],
      [8, 9], [9, 10],
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    positions: [
      { label: "GK", x: 50, y: 92 },
      { label: "LB", x: 15, y: 72 },
      { label: "CB", x: 38, y: 76 },
      { label: "CB", x: 62, y: 76 },
      { label: "RB", x: 85, y: 72 },
      { label: "LM", x: 15, y: 48 },
      { label: "CM", x: 38, y: 52 },
      { label: "CM", x: 62, y: 52 },
      { label: "RM", x: 85, y: 48 },
      { label: "ST", x: 38, y: 22 },
      { label: "ST", x: 62, y: 22 },
    ],
    links: [
      [0, 2], [0, 3],
      [1, 2], [2, 3], [3, 4],
      [1, 5], [5, 6], [6, 7], [7, 8], [4, 8],
      [5, 9], [6, 9], [7, 10], [8, 10],
      [9, 10],
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    positions: [
      { label: "GK", x: 50, y: 92 },
      { label: "CB", x: 25, y: 76 },
      { label: "CB", x: 50, y: 78 },
      { label: "CB", x: 75, y: 76 },
      { label: "LWB", x: 12, y: 52 },
      { label: "CM", x: 35, y: 55 },
      { label: "CDM", x: 50, y: 60 },
      { label: "CM", x: 65, y: 55 },
      { label: "RWB", x: 88, y: 52 },
      { label: "ST", x: 38, y: 22 },
      { label: "ST", x: 62, y: 22 },
    ],
    links: [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [2, 3],
      [1, 4], [1, 5], [2, 6], [3, 7], [3, 8],
      [4, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [7, 10], [9, 10],
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    positions: [
      { label: "GK", x: 50, y: 92 },
      { label: "LB", x: 15, y: 72 },
      { label: "CB", x: 38, y: 76 },
      { label: "CB", x: 62, y: 76 },
      { label: "RB", x: 85, y: 72 },
      { label: "CDM", x: 38, y: 58 },
      { label: "CDM", x: 62, y: 58 },
      { label: "LAM", x: 20, y: 38 },
      { label: "CAM", x: 50, y: 34 },
      { label: "RAM", x: 80, y: 38 },
      { label: "ST", x: 50, y: 18 },
    ],
    links: [
      [0, 2], [0, 3],
      [1, 2], [2, 3], [3, 4],
      [1, 5], [2, 5], [3, 6], [4, 6],
      [5, 6], [5, 7], [5, 8], [6, 8], [6, 9],
      [7, 8], [8, 9], [8, 10],
    ],
  },
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);
