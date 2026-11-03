/** Quarters are "YYYY-Qn". */
export type Quarter = string;

export function parseQ(q: Quarter) {
  const m = /^(\d{4})-Q([1-4])$/.exec(q);
  if (!m) throw new Error(`Bad quarter ${q}`);
  return { y: +m[1], n: +m[2] };
}
const idx = (q: Quarter) => { const { y, n } = parseQ(q); return y * 4 + (n - 1); };
const fromIdx = (i: number) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;

export function quarterOf(d: Date): Quarter {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

export function range(start: Quarter, end: Quarter): Quarter[] {
  const a = idx(start), b = idx(end);
  const out: Quarter[] = [];
  for (let i = a; i <= b; i++) out.push(fromIdx(i));
  return out;
}

/** A quarter has elapsed once it has fully ended. */
export function elapsed(q: Quarter, now = new Date()) {
  return idx(q) < idx(quarterOf(now));
}

export function compare(a: Quarter, b: Quarter) {
  return idx(a) - idx(b);
}

/** Quarters offered in pickers: two years back to ten years ahead. */
export function pickerQuarters(now = new Date()): Quarter[] {
  const c = idx(quarterOf(now));
  return range(fromIdx(c - 8), fromIdx(c + 40));
}

export function label(q: Quarter) {
  const { y, n } = parseQ(q);
  return `Q${n} ${y}`;
}
