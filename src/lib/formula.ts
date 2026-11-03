/**
 * Safe formula engine for valuation models. No eval: formulas are tokenised and
 * parsed into an AST, then evaluated against a map of KPI values.
 *
 * Syntax
 *   numbers      12, 1.5, 15%  (15% = 0.15)
 *   KPI codes    MRR, EBITDA_GROWTH  (letters, digits, underscore)
 *   operators    + - * / ^   comparisons > >= < <= = !=
 *   functions    AVG, SUM, MIN, MAX, ABS, ROUND(x, dp), IF(cond, a, b), AND, OR, NOT
 */

export type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "un"; op: "-" | "+"; a: Node }
  | { t: "bin"; op: string; a: Node; b: Node; group?: boolean }
  | { t: "call"; fn: string; args: Node[] };

export class FormulaError extends Error {}

type Tok = { k: "num" | "id" | "op" | "(" | ")" | ","; v: string; pos: number };

const OPS = [">=", "<=", "!=", "==", "<>", "+", "-", "*", "/", "^", ">", "<", "="];

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?%?/i.exec(src.slice(i))!;
      out.push({ k: "num", v: m[0], pos: i }); i += m[0].length; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))!;
      out.push({ k: "id", v: m[0], pos: i }); i += m[0].length; continue;
    }
    if (c === "(" || c === ")" || c === ",") { out.push({ k: c, v: c, pos: i }); i++; continue; }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (op) { out.push({ k: "op", v: op, pos: i }); i += op.length; continue; }
    throw new FormulaError(`Unexpected character “${c}” at position ${i + 1}`);
  }
  return out;
}

const FUNCS: Record<string, [min: number, max: number]> = {
  AVG: [1, 99], AVERAGE: [1, 99], SUM: [1, 99], MIN: [1, 99], MAX: [1, 99],
  ABS: [1, 1], ROUND: [1, 2], IF: [3, 3], AND: [1, 99], OR: [1, 99], NOT: [1, 1],
};

export function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (...ops: string[]) => peek()?.k === "op" && ops.includes(peek().v);
  const expect = (k: Tok["k"]) => {
    const t = toks[p];
    if (!t || t.k !== k) throw new FormulaError(t ? `Expected “${k}” at position ${t.pos + 1}` : `Formula ends early: expected “${k}”`);
    p++; return t;
  };

  // precedence: comparison < additive < multiplicative < power < unary < primary
  function comparison(): Node {
    let a = additive();
    while (isOp(">", ">=", "<", "<=", "=", "==", "!=", "<>")) {
      let op = toks[p++].v; if (op === "==") op = "="; if (op === "<>") op = "!=";
      a = { t: "bin", op, a, b: additive() };
    }
    return a;
  }
  function additive(): Node {
    let a = multiplicative();
    while (isOp("+", "-")) { const op = toks[p++].v; a = { t: "bin", op, a, b: multiplicative() }; }
    return a;
  }
  function multiplicative(): Node {
    let a = power();
    while (isOp("*", "/")) { const op = toks[p++].v; a = { t: "bin", op, a, b: power() }; }
    return a;
  }
  function power(): Node {
    const a = unary();
    if (isOp("^")) { p++; return { t: "bin", op: "^", a, b: power() }; }
    return a;
  }
  function unary(): Node {
    if (isOp("-", "+")) { const op = toks[p++].v as "-" | "+"; return { t: "un", op, a: unary() }; }
    return primary();
  }
  function primary(): Node {
    const t = peek();
    if (!t) throw new FormulaError("Formula ends early");
    if (t.k === "num") {
      p++;
      const pct = t.v.endsWith("%");
      const v = parseFloat(pct ? t.v.slice(0, -1) : t.v);
      return { t: "num", v: pct ? v / 100 : v };
    }
    if (t.k === "(") { p++; const e = comparison(); expect(")"); return e.t === "bin" ? { ...e, group: true } : e; }
    if (t.k === "id") {
      p++;
      const name = t.v.toUpperCase();
      if (peek()?.k === "(") {
        const spec = FUNCS[name];
        if (!spec) throw new FormulaError(`Unknown function ${t.v}`);
        p++;
        const args: Node[] = [];
        if (peek()?.k !== ")") {
          args.push(comparison());
          while (peek()?.k === ",") { p++; args.push(comparison()); }
        }
        expect(")");
        if (args.length < spec[0] || args.length > spec[1]) throw new FormulaError(`${name} takes ${spec[0] === spec[1] ? spec[0] : `${spec[0]}+`} argument(s)`);
        return { t: "call", fn: name === "AVERAGE" ? "AVG" : name, args };
      }
      return { t: "var", name };
    }
    throw new FormulaError(`Unexpected “${t.v}” at position ${t.pos + 1}`);
  }

  const node = comparison();
  if (p < toks.length) throw new FormulaError(`Unexpected “${toks[p].v}” at position ${toks[p].pos + 1}`);
  return node;
}

export function variables(node: Node, acc = new Set<string>()): Set<string> {
  if (node.t === "var") acc.add(node.name);
  else if (node.t === "un") variables(node.a, acc);
  else if (node.t === "bin") { variables(node.a, acc); variables(node.b, acc); }
  else if (node.t === "call") node.args.forEach((a) => variables(a, acc));
  return acc;
}

export type Values = Record<string, number | null | undefined>;

export function evaluate(node: Node, vars: Values): number {
  const ev = (n: Node) => evaluate(n, vars);
  switch (node.t) {
    case "num": return node.v;
    case "var": {
      const v = vars[node.name];
      if (v === undefined || v === null || Number.isNaN(v)) throw new FormulaError(`Missing value for ${node.name}`);
      return v;
    }
    case "un": return node.op === "-" ? -ev(node.a) : ev(node.a);
    case "bin": {
      const a = ev(node.a), b = ev(node.b);
      switch (node.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": if (b === 0) throw new FormulaError("Division by zero"); return a / b;
        case "^": return a ** b;
        case ">": return +(a > b);
        case ">=": return +(a >= b);
        case "<": return +(a < b);
        case "<=": return +(a <= b);
        case "=": return +(a === b);
        case "!=": return +(a !== b);
      }
      throw new FormulaError(`Unknown operator ${node.op}`);
    }
    case "call": {
      if (node.fn === "IF") return ev(node.args[0]) ? ev(node.args[1]) : ev(node.args[2]);
      const xs = node.args.map(ev);
      switch (node.fn) {
        case "AVG": return xs.reduce((s, x) => s + x, 0) / xs.length;
        case "SUM": return xs.reduce((s, x) => s + x, 0);
        case "MIN": return Math.min(...xs);
        case "MAX": return Math.max(...xs);
        case "ABS": return Math.abs(xs[0]);
        case "ROUND": { const f = 10 ** (xs[1] ?? 0); return Math.round(xs[0] * f) / f; }
        case "AND": return +xs.every(Boolean);
        case "OR": return +xs.some(Boolean);
        case "NOT": return +!xs[0];
      }
      throw new FormulaError(`Unknown function ${node.fn}`);
    }
  }
}

/** Render a node back to readable text (used for the valuation walk). */
export function print(n: Node): string {
  switch (n.t) {
    case "num": return String(n.v);
    case "var": return n.name;
    case "un": return `${n.op}${print(n.a)}`;
    case "bin": {
      if (n.group) return `(${print({ ...n, group: false })})`;
      const wrap = (c: Node) => (c.t === "bin" && !c.group && !["*", "/", "^"].includes(c.op) && ["*", "/", "^"].includes(n.op) ? `(${print(c)})` : print(c));
      return `${wrap(n.a)} ${n.op} ${wrap(n.b)}`;
    }
    case "call": return `${n.fn}(${n.args.map(print).join(", ")})`;
  }
}

/** Split a top-level product into its factors: a * b / c -> [a, b, 1/c]. */
function factors(n: Node): { node: Node; invert: boolean }[] {
  if (n.t === "bin" && !n.group && n.op === "*") return [...factors(n.a), ...factors(n.b)];
  if (n.t === "bin" && !n.group && n.op === "/") return [...factors(n.a), ...factors(n.b).map((f) => ({ ...f, invert: !f.invert }))];
  return [{ node: n, invert: false }];
}

export type WalkStep = { label: string; factor: number; running: number };

/** Step-by-step valuation: base value, then each multiplier and the running total. */
export function walk(node: Node, vars: Values): WalkStep[] {
  const fs = factors(node);
  const steps: WalkStep[] = [];
  let running = 1;
  for (const f of fs) {
    const raw = evaluate(f.node, vars);
    const factor = f.invert ? 1 / raw : raw;
    running *= factor;
    steps.push({ label: (f.invert ? "÷ " : "") + print(f.node), factor, running });
  }
  return steps;
}

export type Check = { ok: true; vars: string[] } | { ok: false; error: string };

/** Validate a formula against the KPI codes defined on a model. */
export function check(formula: string, codes: string[]): Check {
  try {
    const node = parse(formula);
    const used = [...variables(node)];
    const known = new Set(codes.map((c) => c.toUpperCase()));
    const unknown = used.filter((v) => !known.has(v));
    if (unknown.length) return { ok: false, error: `Unknown KPI${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}` };
    return { ok: true, vars: used };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function compute(formula: string, vars: Values): { value: number; steps: WalkStep[] } | { error: string } {
  try {
    const node = parse(formula);
    const upper = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k.toUpperCase(), v]));
    const value = evaluate(node, upper);
    if (!Number.isFinite(value)) return { error: "Result is not a finite number" };
    return { value, steps: walk(node, upper) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
