import { elapsed } from "./quarters";
import { variance } from "./plan";

/** Counts KPI-quarters that have ended and are significantly behind or ahead of plan. */
export function initiativeStatus(adjustments: { quarter: string; planned: number | null; actual: number | null }[]) {
  let behind = 0, ahead = 0, missing = 0;
  for (const a of adjustments) {
    if (!elapsed(a.quarter)) continue;
    if (a.planned !== null && a.actual === null) { missing++; continue; }
    const v = variance(a.planned, a.actual);
    if (v?.significant) { if (v.behind) behind++; else ahead++; }
  }
  return { behind, ahead, missing };
}
