/**
 * Reduced-motion-aware tween helper. Wraps Motion One's animate() so every
 * call respects prefers-reduced-motion automatically.
 */
import { animate, type AnimationOptions } from 'motion';

export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function tween(
  el: Element | string,
  to: Record<string, unknown>,
  opts: AnimationOptions = {},
) {
  if (reducedMotion()) {
    // Apply final state instantly
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (node && node instanceof HTMLElement) {
      Object.entries(to).forEach(([k, v]) => {
        (node.style as any)[k] = String(v);
      });
    }
    return;
  }
  return animate(el, to, { duration: 0.3, easing: 'ease-out', ...opts });
}
