"use client";

import { useCallback, useEffect, useState } from "react";
import { publishToolProgress } from "@/lib/tools/tool-output";

/**
 * Drop-in replacement for the `busy` flag every tool already keeps, which
 * additionally reports the run to the shared output panel so the person can
 * see that work is underway.
 *
 * Deliberately shaped exactly like `useState(false)` so tools adopt it by
 * swapping one line, and nothing else about how they track their own state
 * has to change.
 */
export function useToolBusy(label?: string): [boolean, (next: boolean) => void] {
  const [busy, setBusyState] = useState(false);

  const setBusy = useCallback(
    (next: boolean) => {
      setBusyState(next);
      publishToolProgress({ active: next, label });
    },
    [label]
  );

  // Navigating away mid-run shouldn't leave the panel spinning for the next page.
  useEffect(() => () => publishToolProgress({ active: false }), []);

  return [busy, setBusy];
}
