/**
 * Delays invoking the callback until after the specified number of milliseconds
 * have elapsed since the last time the debounced function was called. Useful for
 * limiting how often a function fires in response to rapid events like keystrokes
 * or window resizes.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
