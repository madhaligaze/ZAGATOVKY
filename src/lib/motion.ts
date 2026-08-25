import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

export { gsap, ScrollTrigger, Flip };

/**
 * Единая точка проверки: если пользователь просил меньше движения — мы не анимируем,
 * а сразу ставим конечное состояние. Проверяется в каждом хуке и эффекте.
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Общие тайминги, чтобы движение по сайту читалось как одна система. */
export const timing = {
  fast: 0.35,
  base: 0.6,
  slow: 0.9,
  ease: 'power3.out',
  easeSoft: 'power2.out',
} as const;

/**
 * Клон фотографии товара улетает в иконку корзины.
 * Работает поверх layout'а через position: fixed, поэтому не влияет на сетку.
 */
export const flyToCart = (source: HTMLElement, target: HTMLElement) => {
  if (prefersReducedMotion()) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.cssText = `
    position: fixed;
    left: ${from.left}px;
    top: ${from.top}px;
    width: ${from.width}px;
    height: ${from.height}px;
    margin: 0;
    border-radius: 12px;
    object-fit: cover;
    pointer-events: none;
    z-index: 90;
    will-change: transform, opacity;
  `;
  document.body.appendChild(clone);

  const scale = Math.max(to.width / from.width, 0.08);

  gsap
    .timeline({ onComplete: () => clone.remove() })
    .to(clone, {
      left: to.left + to.width / 2 - from.width / 2,
      top: to.top + to.height / 2 - from.height / 2,
      scale,
      opacity: 0.15,
      borderRadius: '999px',
      duration: 0.75,
      ease: 'power2.in',
    })
    .to(target, { scale: 1.25, duration: 0.14, ease: 'power2.out' }, '-=0.12')
    .to(target, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
};
