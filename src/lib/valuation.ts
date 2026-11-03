import { compute } from "./formula";

export function parseInputs(json: string): Record<string, number | null> {
  try {
    const o = JSON.parse(json);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

/** Live value from the model's current formula, plus whether it has drifted from the saved value. */
export function liveValue(v: { inputs: string; savedValue: number | null; model: { formula: string } }) {
  const r = compute(v.model.formula, parseInputs(v.inputs));
  const value = "value" in r ? r.value : null;
  const drift = value !== null && v.savedValue !== null && Math.abs(value - v.savedValue) > Math.max(1, Math.abs(v.savedValue) * 1e-9);
  return { value, error: "error" in r ? r.error : null, steps: "steps" in r ? r.steps : [], drift };
}
