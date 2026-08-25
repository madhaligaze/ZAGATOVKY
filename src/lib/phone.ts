/**
 * Казахстанский номер: код страны +7 всегда наш и в поле не вводится — он нарисован
 * рядом отдельной надписью. Пользователь вводит только десять национальных цифр,
 * и храним мы именно их. Маска рисуется при показе, поэтому лишние символы не
 * попадают в состояние, а «лишняя» одиннадцатая цифра просто не влезает,
 * вместо того чтобы сдвигать номер.
 */

export const PHONE_DIGITS = 10;

/** '7071234567' → '(707) 123-45-67' — то, что видно внутри поля */
export const formatKzNational = (digits: string) => {
  if (!digits) return '';

  const area = digits.slice(0, 3);
  const first = digits.slice(3, 6);
  const second = digits.slice(6, 8);
  const third = digits.slice(8, 10);

  let out = `(${area}`;
  if (area.length === 3) out += ')';
  if (first) out += ` ${first}`;
  if (second) out += `-${second}`;
  if (third) out += `-${third}`;
  return out;
};

/** Полный номер для показа: '+7 (707) 123-45-67' */
export const formatKzPhone = (digits: string) =>
  digits ? `+7 ${formatKzNational(digits)}` : '';

/** Что уходит на сервер и в WhatsApp: '+77071234567' */
export const toE164 = (digits: string) => (digits ? `+7${digits}` : '');

export const isCompleteKzPhone = (digits: string) => digits.length === PHONE_DIGITS;

/**
 * Разбирает содержимое поля обратно в десять цифр.
 *
 * `previous` нужен, чтобы отличить удаление разделителя от удаления цифры: без этого
 * Backspace упирается в «)» или «-» и номер нельзя стереть до конца.
 */
export const parseKzPhoneInput = (raw: string, previous: string) => {
  // Ведущая восьмёрка — междугородний префикс, внутри самого номера её не бывает
  let digits = raw.replace(/\D/g, '').replace(/^8+/, '');

  const shown = formatKzNational(previous);

  /**
   * Код страны отбрасываем только тогда, когда поле заполнили целиком — вставкой
   * или программно. При обычном наборе этого делать нельзя: национальные номера
   * тоже начинаются с семёрки, и лишняя одиннадцатая цифра сдвигала бы весь
   * номер влево, молча портя его с начала. Отличаем по тому, что содержимое
   * заменили, а не отредактировали на один символ.
   */
  const replaced = Math.abs(raw.length - shown.length) > 1;
  if (replaced && digits.length > PHONE_DIGITS && digits.startsWith('7')) digits = digits.slice(1);

  // Всё сверх десяти цифр просто не влезает и не трогает уже набранное
  digits = digits.slice(0, PHONE_DIGITS);

  /*
   * Backspace, съевший разделитель: цифры те же, а строка ровно на символ короче.
   * Тогда убираем последнюю цифру сами, иначе курсор упирается в «)» или «-»
   * и номер нельзя стереть до конца.
   *
   * Разница ровно в один символ здесь принципиальна: при вставке короткого номера
   * поверх длинного цифры тоже могут совпасть, и без этой проверки у вставленного
   * номера отрезалась бы последняя цифра.
   */
  const removedSeparator = digits === previous && shown.length - raw.length === 1;
  return removedSeparator ? digits.slice(0, -1) : digits;
};
