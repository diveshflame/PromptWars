export interface Debounced<Args extends unknown[]> {
  (...args: Args): void;
  /** Cancels a pending call. Call this on unmount so a stale timer can't fire against dead state. */
  cancel: () => void;
}

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delayMs: number): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  }) as Debounced<Args>;

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
