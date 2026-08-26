# Промпты для товарных обложек

## Размер и соотношение

Для **всех 12 товаров** используется один формат: **1600 × 2000 px**, вертикальное соотношение **4:5**.

Этот один файл используется в каталоге, карточке товара, корзине, оформлении заказа, подборках на главной и в блоке первого экрана. Объект на фото должен быть в центре и иметь свободное поле около 10–12% с каждой стороны: интерфейс использует `object-cover`.

Если генератор не поддерживает 1600 × 2000, выберите любой нативный размер 4:5, например **1024 × 1280 px**. Не делайте изображения меньше 1200 × 1500 px, если есть выбор. Формат файла: PNG, JPEG или WebP; размер — до 15 МБ.

Отдельный случай: `public/og-cover.png` — это горизонтальное превью ссылки в мессенджерах, **1200 × 630 px**. Это не товарная обложка и сейчас его менять не нужно.

Категории на главной сейчас отображаются текстовыми карточками без фотографий — отдельных изображений для «Овощей», «Мяса» и других категорий не требуется.

## Общие правила для всех промптов

- Фотореалистичная предметная food-фотография, без упаковки и брендов.
- Белый бесшовный фон, мягкий дневной свет, лёгкая естественная тень.
- Угол камеры — примерно 45° сверху; продукт крупный, но не касается краёв кадра.
- Без текста, логотипов, водяных знаков, рук, посуды, разделочных досок, приборов и декора.
- Для мяса: чистый кулинарный вид, без крови и без каких-либо «графичных» деталей.
- Во всех 12 генерациях сохранить одинаковый фон, свет и спокойную цветокоррекцию.

## Готовые промпты

В интерфейсе генератора отдельно установите размер **1600 × 2000 px / 4:5 portrait** и вставьте нужный текст целиком.

### 1. Свёкла

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of freshly peeled raw beetroot cut into thin, even julienne strips. Natural deep burgundy color and crisp, moist cut surfaces. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 2. Капуста

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of finely shredded fresh white cabbage. Thin, even, crisp pale-ivory and light-green strands with natural texture. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 3. Морковь

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of freshly grated raw carrot. Uniform fine vivid-orange shreds, crisp and naturally moist texture. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 4. Лук репчатый

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of peeled white onion diced into small, even cubes. Clean fresh translucent-white pieces, natural culinary appearance. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 5. Картофель нарезанный

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of peeled raw potato cut into even thin sticks. Fresh pale creamy color and clean vacuum-fresh culinary appearance. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 6. Картофель для запекания

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of peeled raw potato cut into large, even roasting wedges. Fresh pale creamy color and clean culinary appearance. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 7. Куриное филе кубиками

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of clean raw chicken breast cut into uniform, even cubes. Pale pink fresh culinary appearance; absolutely no blood and no gore. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 8. Говядина кубиками

```text
Photorealistic premium grocery catalog food photography of a generous centered pile of clean lean raw beef cut into uniform, even cubes. Natural red color, trimmed with no sinew; absolutely no blood and no gore. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 9. Масло растительное

```text
Photorealistic premium grocery catalog food photography of one small clear unbranded glass portion cup filled with golden sunflower oil, centered. No bottle, label, or other objects. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 10. Специи и соль

```text
Photorealistic premium grocery catalog food photography of a small neat centered arrangement of four separate tiny piles: coarse white salt, black pepper, paprika, and dried herbs. No bowls, no packaging, and no labels. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, subject centered with 12% clean margin on every side. No logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 11. Борщевой набор

```text
Photorealistic premium grocery catalog food photography of a centered tidy culinary set with four separate small piles: julienned beetroot, shredded white cabbage, grated carrot, and diced onion. All raw, fresh, naturally textured, and visually balanced; no extra ingredients. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, each element centered with a 12% clean margin around the full arrangement. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

### 12. Набор с курицей

```text
Photorealistic premium grocery catalog food photography of a centered tidy culinary set with four separate elements: diced raw chicken breast, peeled potato roasting wedges, a small clear portion cup of golden sunflower oil, and a small pile of dry spices. Clean and visually balanced; absolutely no blood and no gore. Plain white seamless studio background, soft natural daylight, gentle realistic shadow, 45-degree top-down product shot. Vertical 4:5 composition, each element centered with a 12% clean margin around the full arrangement. No packaging, labels, logos, text, watermarks, hands, utensils, cutting boards, or decorative props. Calm natural color grading; no glossy advertising look.
```

## Проверка перед загрузкой

1. У файла размер 1600 × 2000 px или другое точное 4:5.
2. Важный объект остаётся в центральных 80% кадра.
3. Нет текста, логотипов, лишней упаковки или посторонних предметов.
4. Все карточки выглядят как единая серия: одинаковые белый фон, свет и настроение.
5. Загрузите файл в «Медиатеку», затем назначьте его первым фото соответствующего товара: именно первое фото становится обложкой.
