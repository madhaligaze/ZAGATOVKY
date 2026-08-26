import type { paths } from './api';

/**
 * Доменные псевдонимы поверх сгенерированной OpenAPI-схемы.
 * Файл api.ts перегенерируется командой `npm run gen:types` с запущенного API —
 * если бэкенд поменяет форму ответа, тайпчек упадёт здесь, а не в рантайме.
 */

type Json<T extends { content: { 'application/json': unknown } }> = T['content']['application/json'];

export type Category = Json<
  paths['/api/v1/catalog/categories']['get']['responses'][200]
>[number];

export type ProductList = Json<paths['/api/v1/catalog/products']['get']['responses'][200]>;
export type ProductCard = ProductList['items'][number];

export type ProductDetail = Json<
  paths['/api/v1/catalog/products/{slug}']['get']['responses'][200]
>;

export type Collection = Json<
  paths['/api/v1/catalog/collections/{slug}']['get']['responses'][200]
>;

export type HomeData = Json<paths['/api/v1/home']['get']['responses'][200]>;
export type HomeSection = HomeData['sections'][number];
export type PublicSettings = HomeData['settings'];

export type CreateOrderInput = NonNullable<
  paths['/api/v1/orders']['post']['requestBody']
>['content']['application/json'];

export type CreatedOrder = Json<paths['/api/v1/orders']['post']['responses'][201]>;

export type FeedbackInput = NonNullable<
  paths['/api/v1/feedback']['post']['requestBody']
>['content']['application/json'];

export type ProductQuery = NonNullable<
  paths['/api/v1/catalog/products']['get']['parameters']['query']
>;

export type Localized = ProductCard['name'];
export type LocalizedNullable = ProductCard['short'];
export type Locale = 'ru' | 'kk';
export type WeightUnit = ProductCard['weight']['unit'];
export type StockStatus = ProductCard['stockStatus'];
export type Badge = ProductCard['badges'][number];
