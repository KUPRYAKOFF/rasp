export const LANGUAGES = Object.freeze([
  {id: 'ru', name: 'Русский'},
  {id: 'en', name: 'Английский'},
  {id: 'ru-pre', name: 'Дореволюционный'}
]);

// Keys are the original Russian labels. Each row contains English and
// Russian in pre-1918 orthography, in that order.
const messages = Object.freeze({
  'Главная': ['Home', 'Главная'],
  'Преподаватели': ['Teachers', 'Преподаватели'],
  'Настройки': ['Settings', 'Настройки'],
  'Основные разделы': ['Main navigation', 'Главные раздѣлы'],
  'Моё расписание': ['My schedule', 'Моё расписаніе'],
  'Расписание занятий': ['Class schedule', 'Расписаніе занятій'],
  'Учебная группа': ['Study group', 'Учебная группа'],
  'Неизвестная группа': ['Unknown group', 'Неизвѣстная группа'],
  'Группа №{number}': ['Group No. {number}', 'Группа №{number}'],
  'Ваша группа: {name}': ['Your group: {name}', 'Ваша группа: {name}'],

  'Обновить': ['Refresh', 'Обновить'],
  'Проверить обновления': ['Check for updates', 'Провѣрить обновленія'],
  'Получаем данные расписания…': ['Fetching schedule data…', 'Получаемъ данныя расписанія…'],
  'Загружаем расписание…': ['Loading schedule…', 'Загружаемъ расписаніе…'],
  'Обновляем расписание…': ['Refreshing the schedule…', 'Обновляемъ расписаніе…'],
  'Обновлено': ['Updated', 'Обновлено'],
  'Проверьте актуальность': ['Schedule may be out of date', 'Провѣрьте актуальность'],
  'Иркутск': ['Irkutsk', 'Иркутскъ'],
  'неполные данные': ['incomplete data', 'неполныя данныя'],
  'нет данных': ['no data', 'нѣтъ данныхъ'],
  'Некорректный формат расписания': ['Invalid schedule format', 'Невѣрный форматъ расписанія'],
  'Не удалось загрузить: {error}': ['Loading failed: {error}', 'Не удалось загрузить: {error}'],
  'Расписание недоступно': ['Schedule unavailable', 'Расписаніе недоступно'],
  'Не удалось получить данные. Проверьте интернет-соединение или повторите попытку.': [
    'Could not load the schedule. Check your connection or try again.',
    'Не удалось получить данныя. Провѣрьте соединеніе или повторите попытку.'
  ],
  'Попробовать снова': ['Try again', 'Попробовать снова'],
  'Новых данных пока нет': ['No new data yet', 'Новыхъ данныхъ пока нѣтъ'],
  'Расписание обновлено': ['Schedule updated', 'Расписаніе обновлено'],
  'Нет соединения — показано сохранённое расписание': ['Offline — showing saved schedule', 'Нѣтъ соединенія — показано сохранённое расписаніе'],

  'Режим отображения': ['Schedule view', 'Режимъ отображенія'],
  'Вся неделя': ['Full week', 'Вся недѣля'],
  '3 дня': ['3 days', '3 дня'],
  '2 дня': ['2 days', '2 дня'],
  'Чётная неделя': ['Even week', 'Чётная недѣля'],
  'Нечётная неделя': ['Odd week', 'Нечётная недѣля'],
  'Чётность не установлена': ['Week parity unset', 'Чётность не установлена'],
  'Чётная': ['Even', 'Чётная'],
  'Нечётная': ['Odd', 'Нечётная'],
  'Предыдущие дни': ['Previous days', 'Предыдущіе дни'],
  'Следующие дни': ['Next days', 'Слѣдующіе дни'],
  'Выбор дней недели': ['Select days of the week', 'Выборъ дней недѣли'],
  'включая сегодня': ['including today', 'включая сегодня'],
  'Сегодня': ['Today', 'Сегодня'],
  'Перелистывайте дни свайпом вправо или влево': ['Swipe left or right to browse days', 'Листайте дни движеніемъ пальца вправо или влѣво'],
  'Понедельник': ['Monday', 'Понедѣльникъ'],
  'Вторник': ['Tuesday', 'Вторникъ'],
  'Среда': ['Wednesday', 'Среда'],
  'Четверг': ['Thursday', 'Четвергъ'],
  'Пятница': ['Friday', 'Пятница'],
  'Суббота': ['Saturday', 'Суббота'],
  'Пн': ['Mon', 'Пн'],
  'Вт': ['Tue', 'Вт'],
  'Ср': ['Wed', 'Ср'],
  'Чт': ['Thu', 'Чт'],
  'Пт': ['Fri', 'Пт'],
  'Сб': ['Sat', 'Сб'],

  '{number} пара': ['Period {number}', '{number} пара'],
  'Нет занятий': ['No classes', 'Нѣтъ занятій'],
  'Кабинет {room}': ['Room {room}', 'Кабинетъ {room}'],
  'Занятие': ['Class', 'Занятіе'],
  'День': ['Day', 'День'],
  'Пара': ['Period', 'Пара'],
  'Время': ['Time', 'Время'],
  'Уточняется': ['To be confirmed', 'Уточняется'],
  'Предмет': ['Subject', 'Предметъ'],
  'Преподаватель': ['Teacher', 'Преподаватель'],
  'Не указан': ['Not specified', 'Не указанъ'],
  'Не указана': ['Not specified', 'Не указана'],
  'Группа': ['Group', 'Группа'],
  'Аудитория': ['Room', 'Аудиторія'],
  'Чётность': ['Week parity', 'Чётность'],
  'Каждую неделю': ['Every week', 'Каждую недѣлю'],
  'Чётность неизвестна': ['Week parity unknown', 'Чётность неизвѣстна'],
  'Сейчас актуально': ['Scheduled this week', 'Назначено на эту недѣлю'],
  'На другой неделе': ['Scheduled for another week', 'На другой недѣлѣ'],
  'В API есть информация об изменении занятия. Дата действия изменения не подтверждена.': [
    'The API reports a change to this class. The effective date is unconfirmed.',
    'Въ API есть свѣдѣнія объ измѣненіи занятія. Дата дѣйствія измѣненія не подтверждена.'
  ],

  'Закрыть': ['Close', 'Закрыть'],
  'Выберите группу': ['Select a group', 'Выберите группу'],
  'Поиск группы': ['Find a group', 'Поискъ группы'],
  'Например, ТИТО или КСК': ['e.g. ТИТО or КСК', 'Напримѣръ, ТИТО или КСК'],
  '{number} курс': ['Year {number}', '{number} курсъ'],
  'Ничего не найдено': ['No results', 'Ничего не найдено'],
  'Список групп пока недоступен': ['Group list unavailable', 'Списокъ группъ пока недоступенъ'],
  'Выбрать преподавателя': ['Select a teacher', 'Выбрать преподавателя'],
  'Выберите преподавателя': ['Select a teacher', 'Выберите преподавателя'],
  'Поиск преподавателя': ['Find a teacher', 'Поискъ преподавателя'],
  'Введите фамилию': ['Enter a surname', 'Введите фамилію'],

  'Моя группа': ['My group', 'Моя группа'],
  'Язык': ['Language', 'Языкъ'],
  'Русский': ['Russian', 'Русскій'],
  'Английский': ['English', 'Англійскій'],
  'Дореволюционный': ['Pre-reform Russian', 'Дореволюціонный'],
  'Тема приложения': ['App theme', 'Тема приложенія'],
  'Полярная ночь': ['Polar Night', 'Полярная ночь'],
  'Светлая': ['Light', 'Свѣтлая'],
  'Графит': ['Graphite', 'Графитъ'],
  'Новогодняя': ['New Year', 'Новогодняя'],
  'Ауспекс': ['Auspex', 'Ауспексъ'],
  'Тёмно-синяя с бирюзовыми акцентами': ['Dark blue with teal accents', 'Тёмно-синяя съ бирюзовыми акцентами'],
  'Светлый фон и тёмный текст': ['Light background and dark text', 'Свѣтлый фонъ и тёмный текстъ'],
  'Строгая монохромная палитра': ['Monochrome palette', 'Строгая монохромная палитра'],
  'Зимнее оформление со снегом и гирляндами': ['Winter styling with snow and string lights', 'Зимнее оформленіе со снѣгомъ и гирляндами'],
  'Полевой терминал с монохромным ЭЛТ-экраном': ['Field terminal with a monochrome CRT', 'Полевой терминалъ съ монохромнымъ ЭЛТ-экраномъ'],
  'О приложении': ['About', 'О приложеніи'],
  'Разработано: Купряков Е.И.': ['Developed by E. I. Kupryakov', 'Разработано: Купряковъ Е. И.'],
  'Приложение неофициальное и не имеет никакого отношения к ГБПОУ ИЭК.': [
    'This is an unofficial app with no affiliation with GBPOU IEK.',
    'Приложеніе неоффиціальное и не имѣетъ никакого отношенія къ ГБПОУ ІЭК.'
  ],
  'Все данные берутся из открытых API ГБПОУ ИЭК.': [
    'All data comes from GBPOU IEK’s public APIs.',
    'Всѣ данныя берутся изъ открытыхъ API ГБПОУ ІЭК.'
  ],
  '© {year} Купряков Е.И.': ['© {year} E. I. Kupryakov', '© {year} Купряковъ Е. И.'],
  'Установка приложения': ['App installation', 'Установка приложенія'],
  'Установить приложение': ['Install app', 'Установить приложеніе'],
  'Приложение установлено': ['App installed', 'Приложеніе установлено'],
  'Через меню браузера: «Установить приложение» или «На экран Домой».': [
    'In your browser menu choose “Install app” or “Add to Home Screen”.',
    'Черезъ меню браузера: «Установить приложеніе» или «На экранъ Домой».'
  ]
});

export function translate(language, key, values = {}) {
  const index = language === 'en' ? 0 : language === 'ru-pre' ? 1 : -1;
  const message = Object.hasOwn(messages, key) ? (messages[key][index] ?? key) : key;
  return message.replace(/\{(\w+)\}/g, (token, name) => Object.hasOwn(values, name) ? String(values[name]) : token);
}

export function localeFor(language) {
  return language === 'en' ? 'en-GB' : 'ru-RU';
}

function historicalMonths(text, language) {
  if (language !== 'ru-pre') return text;
  return text
    .replace(/апреля/g, 'апрѣля')
    .replace(/апрель/g, 'апрѣль')
    .replace(/ию/g, 'ію');
}

export function formatDate(language, date, options) {
  const formatter = new Intl.DateTimeFormat(localeFor(language), options);
  return historicalMonths(formatter.format(date), language);
}

export function formatDateRange(language, start, end, options) {
  const formatter = new Intl.DateTimeFormat(localeFor(language), options);
  const range = formatter.formatRange?.(start, end) ?? `${formatter.format(start)} – ${formatter.format(end)}`;
  return historicalMonths(range, language);
}
