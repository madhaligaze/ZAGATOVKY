import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';

/**
 * Инерционная прокрутка. Один экземпляр на всё приложение — им же пользуются
 * переходы между страницами и якоря, поэтому он лежит здесь модульной переменной,
 * а не в состоянии компонента.
 */
let lenis: Lenis | null = null;

export const getLenis = () => lenis;

/**
 * Прокрутка наверх или к элементу. Пока Lenis не создан (режим «меньше движения»,
 * телефон, ещё не смонтировано) — обычным способом, чтобы вызывающему коду
 * не приходилось знать, включена инерция или нет.
 */
export const scrollTo = (
  target: number | string | HTMLElement,
  options: { immediate?: boolean; offset?: number } = {},
) => {
  if (lenis) {
    lenis.scrollTo(target, { immediate: options.immediate, offset: options.offset ?? 0 });
    return;
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: options.immediate ? 'auto' : 'smooth' });
    return;
  }

  const element = typeof target === 'string' ? document.querySelector(target) : target;
  element?.scrollIntoView({ behavior: options.immediate ? 'auto' : 'smooth', block: 'start' });
};

/**
 * Инерция ощутимо поднимает «дорогое» ощущение от страницы, но у неё есть три
 * места, где она обязана отступить:
 *
 *  1. Режим «меньше движения» — тогда её просто нет, работает нативная прокрутка.
 *  2. Телефон — тач-скролл у системы уже инерционный, второй слой поверх него
 *     ощущается как залипание, поэтому Lenis трогает только колесо мыши.
 *  3. Открытая шторка или модальное окно — Radix блокирует прокрутку body, и без
 *     остановки Lenis страница под окном продолжала бы ехать.
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      duration: 1.05,
      // Затухание без «пружины» в конце: движение должно казаться тяжёлым, а не пружинить
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      // На тач-экранах отдаём прокрутку системе — она уже инерционная
      smoothWheel: true,
      touchMultiplier: 1,
      syncTouch: false,
    });
    lenis = instance;

    // ScrollTrigger должен считать позицию по Lenis, иначе все привязки к прокрутке
    // отстают от картинки ровно на длину инерции.
    instance.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /*
     * Radix при открытии окна вешает на body data-scroll-locked. Ловим это, а не
     * состояние конкретной шторки: окон на витрине несколько (корзина, отзывы),
     * и каждое новое иначе пришлось бы не забыть подключить сюда руками.
     */
    const syncLock = () => {
      if (document.body.hasAttribute('data-scroll-locked')) instance.stop();
      else instance.start();
    };

    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] });
    syncLock();

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);
};
