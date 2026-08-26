import { useEffect, useRef } from 'react';

/**
 * Жидкое искажение надписи под указателем.
 *
 * Слово рисуется в обычный 2D-канвас, тот загружается в WebGL как текстура, а шейдер
 * смещает координаты выборки по следу указателя. Следа хватает короткого: десяти
 * последних точек с затуханием достаточно, чтобы движение читалось как течение,
 * и при этом цикл в шейдере остаётся дешёвым.
 *
 * Своя реализация вместо three.js сознательно: библиотека ради одного полноэкранного
 * прямоугольника стоила бы сотни килобайт, а здесь всё умещается в один файл
 * и грузится отдельным чанком только на десктопе.
 */

const TRAIL = 10;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;

uniform sampler2D uText;
uniform vec2 uTrail[${TRAIL}];
uniform float uAge[${TRAIL}];
uniform float uAspect;
uniform float uStrength;
uniform float uRadius;
uniform float uScroll;

void main() {
  vec2 uv = vUv;
  vec2 offset = vec2(0.0);

  for (int i = 0; i < ${TRAIL}; i++) {
    float age = uAge[i];
    if (age <= 0.0) continue;

    // Расстояние считаем в пропорциях экрана, иначе круг влияния
    // растягивается в эллипс на широких мониторах
    vec2 diff = uv - uTrail[i];
    diff.x *= uAspect;

    float dist = length(diff);
    float influence = smoothstep(uRadius, 0.0, dist) * age;

    // Смещаем от точки наружу — получается расходящаяся волна, а не сдвиг вбок
    offset += normalize(diff + 1e-6) * influence * uStrength;
  }

  /*
   * Лента едет вбок вместе с прокруткой. Текстура содержит целое число повторов
   * слова, поэтому fract даёт бесшовное зацикливание и не нужен режим REPEAT,
   * недоступный в WebGL1 для текстур произвольного размера.
   */
  vec2 t = uv - offset;
  t.x = fract(t.x + uScroll);

  vec4 color = texture2D(uText, t);

  // Лёгкое расслоение по краям волны: рисунок оживает, но остаётся в наших
  // цветах, потому что тянем только альфу
  float shift = length(offset) * 0.35;
  vec2 t1 = uv - offset * (1.0 + shift); t1.x = fract(t1.x + uScroll);
  vec2 t2 = uv - offset * (1.0 - shift); t2.x = fract(t2.x + uScroll);
  color.a = max(color.a, max(texture2D(uText, t1).a, texture2D(uText, t2).a) * 0.85);

  gl_FragColor = color;
}`;

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Шейдер не собрался: ${log}`);
  }
  return shader;
};

export const HeroFlowmap = ({
  word,
  className,
  /** Цвет надписи — берём из темы, чтобы канвас не выпадал из палитры */
  color = '#ebe7e1',
  /** Сколько повторов слова умещается в ленте */
  repeat = 3,
  /** На сколько лент уезжает надпись за экран прокрутки */
  drift = 0.55,
  onReady,
}: {
  word: string;
  className?: string;
  color?: string;
  repeat?: number;
  drift?: number;
  onReady?: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false }) ??
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let disposed = false;
    let frame = 0;

    // ─── программа ──────────────────────────────────────────────────────────
    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Программа не слинковалась');
    } catch {
      // Не собралось — молча уходим, в разметке остаётся обычная надпись
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTrail = gl.getUniformLocation(program, 'uTrail');
    const uAge = gl.getUniformLocation(program, 'uAge');
    const uAspect = gl.getUniformLocation(program, 'uAspect');
    const uStrength = gl.getUniformLocation(program, 'uStrength');
    const uRadius = gl.getUniformLocation(program, 'uRadius');
    const uScroll = gl.getUniformLocation(program, 'uScroll');

    gl.uniform1f(uStrength, 0.045);
    gl.uniform1f(uRadius, 0.28);

    // ─── текстура с надписью ────────────────────────────────────────────────
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const painter = document.createElement('canvas');
    const paint = painter.getContext('2d')!;

    /*
     * Рисуем не одно слово, а целую ленту из повторов: именно она потом едет вбок.
     * Повторов целое число и они равномерны по ширине текстуры — поэтому шов
     * при зацикливании приходится ровно на промежуток между словами.
     */
    const drawText = (width: number, height: number) => {
      painter.width = width;
      painter.height = height;
      paint.clearRect(0, 0, width, height);

      const slot = width / repeat;
      paint.textAlign = 'center';
      paint.textBaseline = 'middle';

      // Кегль подбираем под ячейку повтора, а не под весь экран: иначе на широком
      // мониторе слова наезжают друг на друга
      let size = height * 0.86;
      const fits = () => {
        paint.font = `700 ${size}px "Playfair Display", Georgia, serif`;
        return paint.measureText(word).width <= slot * 0.86;
      };
      while (!fits() && size > 8) size *= 0.94;

      paint.fillStyle = color;
      for (let i = 0; i < repeat; i++) {
        paint.fillText(word, slot * (i + 0.5), height / 2);
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, painter);
    };

    // ─── размеры ────────────────────────────────────────────────────────────
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Плотность ограничиваем двойкой: на 3x-экранах разницы не видно,
      // а пикселей для закраски становится вдвое больше
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);

      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform1f(uAspect, width / height);
      drawText(width, height);
    };

    // Шрифт может приехать позже первого кадра — тогда надпись надо перерисовать,
    // иначе в текстуре навсегда останется запасной Georgia
    document.fonts?.ready.then(() => {
      if (disposed) return;
      resize();
      drawText(canvas.width, canvas.height);
    });

    resize();

    // ─── след указателя ─────────────────────────────────────────────────────
    const trail = new Float32Array(TRAIL * 2);
    const ages = new Float32Array(TRAIL);
    let head = 0;
    let moved = false;

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      if (x < -0.2 || x > 1.2 || y < -0.2 || y > 1.2) return;

      head = (head + 1) % TRAIL;
      trail[head * 2] = x;
      trail[head * 2 + 1] = y;
      ages[head] = 1;
      moved = true;
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    let last = performance.now();
    let announced = false;

    const render = (now: number) => {
      if (disposed) return;
      const delta = Math.min(now - last, 64) / 1000;
      last = now;

      // След тает сам: без затухания волна залипала бы там, где мышь остановилась
      let alive = false;
      for (let i = 0; i < TRAIL; i++) {
        if (ages[i] > 0) {
          ages[i] = Math.max(0, ages[i] - delta * 1.35);
          if (ages[i] > 0) alive = true;
        }
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Смещение ленты берём прямо из позиции прокрутки: так канвас всегда
      // совпадает с остальной страницей, без отдельной синхронизации с GSAP
      const rect = canvas.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      gl.uniform1f(uScroll, progress * drift);

      gl.uniform2fv(uTrail, trail);
      gl.uniform1fv(uAge, ages);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!announced) {
        announced = true;
        onReady?.();
      }

      // Пока указателя не было и след потух — кадры не нужны, но и останавливать
      // цикл нельзя: движение может начаться в любой момент. Дешёвый холостой
      // кадр здесь — это одна отрисовка треугольника, а не пересчёт сцены.
      void (alive || moved);
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onLost = (event: Event) => {
      event.preventDefault();
      disposed = true;
      cancelAnimationFrame(frame);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [word, color, repeat, drift, onReady]);

  return <canvas ref={canvasRef} aria-hidden data-testid="hero-flowmap" className={className} />;
};

export default HeroFlowmap;
