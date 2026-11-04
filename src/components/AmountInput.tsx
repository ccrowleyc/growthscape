"use client";

import { useEffect, useState } from "react";
import { groupDigits, parseAmount } from "@/lib/format";

/**
 * Text input for euro amounts that shows comma separators as you type.
 * Value is a plain number (or null when empty).
 */
export function AmountInput({
  value,
  onChange,
  className = "",
  placeholder,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(groupDigits(value));
  useEffect(() => {
    // Sync when the value changes from outside (e.g. loading an example)
    const parsed = parseAmount(text);
    if (parsed !== value) setText(groupDigits(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.,\-\s€]/g, "");
        const n = parseAmount(raw);
        if (n !== null && Number.isNaN(n)) return;
        // Re-group the integer part while keeping a trailing "." or decimals being typed
        const [int, dec] = raw.replace(/[€,\s]/g, "").split(".");
        const grouped = int === "" || int === "-" ? int : Number(int).toLocaleString("en-IE");
        setText(dec !== undefined ? `${grouped}.${dec}` : grouped);
        onChange(n);
      }}
      className={`w-full min-w-0 bg-transparent tabular-nums focus:outline-none ${className}`}
    />
  );
}
