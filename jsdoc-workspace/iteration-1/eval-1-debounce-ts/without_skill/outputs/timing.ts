/**
 * Returns a debounced version of the provided callback that delays invoking it
 * until after `wait` milliseconds have elapsed since the last call.
 *
 * @param callback - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @returns A debounced function with a `cancel` method to clear any pending invocation.
 *
 * @example
 * const handleResize = debounce(() => {
 *   console.log('resize complete');
 * }, 200);
 *
 * window.addEventListener('resize', handleResize);
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function debounced(...args: Parameters<T>): void {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      callback(...args);
    }, wait);
  }

  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}
