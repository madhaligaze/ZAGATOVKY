// Генерация типов API из OpenAPI-схемы работающего бэкенда.
//
// Раньше адрес подставлялся через ${API_SCHEMA_URL:-...} прямо в npm-скрипте —
// на Windows такой синтаксис не разворачивается. Здесь всё делается на Node,
// без подпроцессов и оболочки, поэтому работает одинаково на любой машине.
import { writeFileSync } from 'node:fs';
import openapiTS, { astToString } from 'openapi-typescript';

const url = process.env.API_SCHEMA_URL ?? 'http://localhost:3000/docs/json';
const out = process.argv[2] ?? 'src/types/api.ts';

console.log(`Схема: ${url} → ${out}`);

try {
  const ast = await openapiTS(new URL(url));
  writeFileSync(out, astToString(ast));
  console.log('Типы обновлены.');
} catch (error) {
  console.error(
    `\nНе удалось получить схему.\n` +
      `Проверьте, что API запущен и доступен по адресу ${url}.\n` +
      `Другой адрес: API_SCHEMA_URL=https://<api>/docs/json pnpm gen:types\n`,
  );
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
