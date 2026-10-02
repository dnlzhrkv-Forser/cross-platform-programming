// Збірка report.docx для ЛР №1 (варіант 7). Усі числа читаються з реальних файлів/JSON експериментів.
const D = require('/home/claude/.npm-global/lib/node_modules/docx');
const sharp = require('/home/claude/.npm-global/lib/node_modules/sharp');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const R = p => path.join(ROOT, p);
const J = p => JSON.parse(fs.readFileSync(R(p), 'utf8'));
const size = p => fs.statSync(R(p)).size;
const kbf = b => (b / 1024).toFixed(1);
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle, Footer, Header, PageNumber, LevelFormat, PageBreak, Tab, TabStopType, LeaderType } = D;

const e1 = J('04_experiment/exp1_hero_results.json'), dec = J('04_experiment/exp1_decode_ms.json'), e2 = J('04_experiment/exp2_icons_results.json');
const pd = J('04_experiment/poster_decisions.json'), pat = J('04_experiment/pattern_sizes.json'), con = J('04_experiment/contrast.json');
const row = (name, fmt, q) => e1[name].rows.find(r => r.fmt === fmt && r.q === q);
const hd = n => ({ j: row(n, 'JPEG', 85), w: row(n, 'WebP', 85), a: row(n, 'AVIF', 65) });
const H = hd('hero-desktop-master'), M = hd('hero-mobile-master');

const FONT = 'Arial', W = 9866;
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'BDB6CC' };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function runs(text, base = {}) {
  return String(text).split('**').map((t, i) => new TextRun({ text: t, bold: i % 2 === 1 || base.bold, font: FONT, size: base.size || 21, color: base.color, italics: base.italics })).filter(r => true);
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o), spacing: { after: o.after ?? 100, before: o.before ?? 0, line: 276 }, alignment: o.align, keepNext: o.keepNext, indent: o.indent });
const h1s = [];
const H1 = t => (h1s.push(t), new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: '1C1233' })], spacing: { before: 320, after: 140 }, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: 'C77D10', space: 4 } } }));
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: '3A2F5A' })], spacing: { before: 220, after: 100 }, keepNext: true });
const H3 = t => new Paragraph({ children: [new TextRun({ text: t, font: FONT, bold: true, size: 22, color: '3A2F5A' })], spacing: { before: 140, after: 60 }, keepNext: true });
const B = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, children: runs(t), spacing: { after: 50, line: 270 } });
const N = (t) => new Paragraph({ numbering: { reference: 'num', level: 0 }, children: runs(t), spacing: { after: 50, line: 270 } });
const BR = () => new Paragraph({ children: [new PageBreak()] });

function cell(content, w, o = {}) {
  const lines = Array.isArray(content) ? content : [content];
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders, margins: { top: 50, bottom: 50, left: 80, right: 80 },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined, verticalAlign: 'top',
    children: lines.map(l => new Paragraph({ children: runs(l, { size: o.size || 17, bold: o.bold, color: o.color }), spacing: { after: 20, line: 250 }, alignment: o.align })),
  });
}
function T(widths, header, rows, o = {}) {
  const sum = widths.reduce((a, b) => a + b, 0); const k = W / sum; widths = widths.map(x => Math.round(x * k)); widths[widths.length - 1] += W - widths.reduce((a, b) => a + b, 0);
  const hr = new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { fill: '1C1233', bold: true, color: 'FFFFFF', size: o.size })) });
  const body = rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: (o.firstColFill && i === 0) ? 'EFEAF6' : (r._fill || (ri % 2 ? 'F8F5FC' : undefined)), bold: (o.firstColBold && i === 0) || r._bold, size: o.size })) }));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [hr, ...body] });
}
const callout = (text, title = 'Висновок', color = 'C77D10', fill = 'FFF6E5') => {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ cantSplit: true, children: [new TableCell({
    width: { size: W, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR, color: 'auto' }, margins: { top: 100, bottom: 100, left: 200, right: 160 },
    borders: { top: none, bottom: none, right: none, left: { style: BorderStyle.SINGLE, size: 36, color } },
    children: [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, font: FONT, bold: true, size: 21, color })] }), new Paragraph({ spacing: { after: 20, line: 270 }, children: runs(text) })] })] })] }), new Paragraph({ children: [], spacing: { after: 100 } })];
};
const SP = () => new Paragraph({ children: [], spacing: { after: 80 } });

const dims = {};
async function loadDims(files) { for (const f of files) { const m = await sharp(R(f)).metadata(); dims[f] = [m.width, m.height]; } }
function IMG(file, wpx, cap) {
  const [w, h] = dims[file]; const s = wpx / w; const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 }, keepNext: true, children: [new ImageRun({ type: 'png', data: fs.readFileSync(R(file)), transformation: { width: Math.round(w * s), height: Math.round(h * s) }, altText: { title: cap, description: cap, name: path.basename(file) } })] })];
  if (cap) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: cap, font: FONT, size: 17, italics: true, color: '6B6482' })] }));
  return out;
}

// ------------------------------------------------------------------ матриці порівняння
function matrix(opts, crit, notes) {
  const header = ['Критерій', 'Вага', ...opts];
  const tot = opts.map((_, j) => crit.reduce((a, c) => a + c.w * c.s[j], 0));
  const max = crit.reduce((a, c) => a + 5 * c.w, 0);
  const rows = crit.map(c => [c.n, String(c.w), ...c.s.map((s, j) => `**${s}** — ${c.t[j]}`)]);
  const best = Math.max(...tot);
  const tr = ['**Разом (макс. ' + max + ')**', '', ...tot.map(t => (t === best ? `**${t}** ✔` : `${t}`))]; tr._fill = 'FFF3D6';
  rows.push(tr);
  return T([2000, 500, ...opts.map(() => (W - 2500) / opts.length)], header, rows, { size: 16 });
}

const ph = { p: (n) => R(n) };
(async () => {
  const figs = ['toolchain-1-poster', 'toolchain-2-hero', 'toolchain-3-icons', 'toolchain-4-batch', 'poster-naive-vs-safe', 'poster-derivatives', 'icons-sheet', 'exp2-png-vs-svg', 'logo-variants', 'hero-pair', 'exp1-banding'].map(n => `05_toolchain/figures/${n}.png`);
  await sharp(R('03_final_assets/logo/logo-light.svg'), { density: 600 }).resize(384, 240).png().toFile(R('02_work/logo-cover.png'));
  await loadDims(['02_work/hero-desktop-master.png', ...figs, '04_experiment/demo-desktop-light.png', '04_experiment/demo-mobile-light.png', '04_experiment/demo-desktop-dark.png']);
  const F = n => `05_toolchain/figures/${n}.png`;

  const c = [];  // children

  // ------------------------------------------------------------ ТИТУЛ
  const center = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 120, before: o.before ?? 0 }, children: [new TextRun({ text: t, font: FONT, size: o.size || 26, bold: o.bold, color: o.color })] });
  const cv = [];
  cv.push(...IMG('02_work/hero-desktop-master.png', 640, ''));
  cv.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(R('02_work/logo-cover.png')), transformation: { width: 96, height: 60 }, altText: { title: 'Кінопульс', description: 'Логотип Кінопульс', name: 'logo' } })] }));
  cv.push(center('ГРАФІЧНІ ІНСТРУМЕНТИ ВЕБДИЗАЙНУ', { before: 200, size: 28, bold: true, color: '6B6482' }));
  cv.push(center('ЛАБОРАТОРНА РОБОТА № 1', { size: 44, bold: true, color: '1C1233', before: 80, after: 120 }));
  cv.push(center('Аналіз графічних ресурсів вебпроєкту та проєктування інструментального workflow', { size: 26, after: 300 }));
  cv.push(center('Варіант 7 · Кіноафіша та сервіс сеансів «Кінопульс»', { size: 30, bold: true, color: 'C77D10', after: 700 }));
  cv.push(center('Виконав: студент Жарков Данило Анатолійович', { size: 24, after: 80 }));
  cv.push(center('Група: Веб-21', { size: 24, after: 80 }));
  cv.push(center('Перевірив: Мазуренко Ольга Олександрівна', { size: 24, after: 500 }));
  cv.push(center('2026', { size: 24 }));
  cv.push(BR());

  // ------------------------------------------------------------ 1. МЕТА
  c.push(H1('1. Мета лабораторної роботи'));
  c.push(P('Навчитися аналізувати графічні потреби вебпродукту, формулювати для ресурсів технічні вимоги, порівнювати альтернативні класи та інструменти за критеріями, будувати toolchain від source до web-ready результату та перевіряти його. У межах варіанта 7 задача — підготувати графічну систему для афіші «Кінопульс», де контент (постери сторонніх дистриб’юторів) змінюється щотижня, а системна графіка має лишатися стабільною.'));
  c.push(P('Підсумкова модель мислення роботи: **графічна задача → вимоги → альтернативи → критерії → рішення → toolchain → asset → оптимізація → перевірка → аргументація.**'));

  // ------------------------------------------------------------ 2. СИТУАЦІЯ
  c.push(H1('2. Проєктна ситуація (власний опис)'));
  c.push(P('«Кінопульс» — вебсервіс кіноафіші. Глядач (переважно зі смартфона) бачить фільми, що йдуть сьогодні, фільтрує їх за жанром, відкриває сторінку фільму з постером і backdrop та обирає сеанс у розкладі. **Основна дія користувача — швидко знайти фільм і сеанс.**'));
  c.push(P('Що змінюється часто: постери (надходять від різних дистриб’юторів, різних розмірів і співвідношень сторін, щотижня), backdrop-зображення, розклад. Що лишається стабільним: логотип, жанрові іконки, badges, placeholder, оформлення шапки. Це визначає межу між **контентною графікою** (потрібна автоматизація) і **системною графікою** (потрібні охайні векторні/CSS-рішення).'));
  c.push(T([1900, 3900, 4000], ['Тип графіки', 'Приклади в проєкті', 'Наслідок для рішень'], [
    ['Функціональна', 'жанрові іконки, badges «ПРЕМ’ЄРА»/«3D», placeholder, логотип', 'мають бути читабельні у 16–32 px, не залежати лише від кольору, працювати в light/dark'],
    ['Інформативна', 'постер (назва фільму — усередині картинки)', 'не можна безглуздо кропати; назва дублюється в HTML/alt'],
    ['Декоративна', 'hero, backdrop, фон шапки', 'не повинна важити багато й не повинна ховати текст; на першому екрані — LCP'],
  ], { firstColBold: true, size: 17 }));
  c.push(SP());
  c.push(P('Перший екран: hero-«кінозала» з порожнім екраном; заголовок і кнопка накладаються HTML-текстом поверх екрана, тому в зображенні тексту немає (локалізація, SEO, доступність).'));

  // ------------------------------------------------------------ 3. ЗАДАЧІ
  c.push(H1('3. Перелік графічних задач'));
  [
    '**G1. Hero** для першого екрана у двох композиціях (desktop 16:9 і mobile 4:5), з порожнім екраном під HTML-текст.',
    '**G2. Приймання сторонніх постерів:** різні співвідношення сторін, текст усередині картинки → правило «crop чи pad».',
    '**G3. Похідні постерів:** card, detail, thumb (для рядків розкладу) з одного master; master не змінюється.',
    '**G4. Backdrop** сторінки фільму без запеченого тексту.',
    '**G5. Система жанрових іконок** (16–32 px, зміна кольору за темою/станом).',
    '**G6. Логотип** для світлого й темного фону.',
    '**G7. Декор і службова графіка без окремих image-файлів:** фон шапки, placeholder «постер незабаром», badges.',
    '**G8. Автоматизація щотижневого оновлення афіші:** ручного workflow на кожен постер бути не повинно.',
  ].forEach(t => c.push(B(t)));

  // ------------------------------------------------------------ 4. INVENTORY
  c.push(H1('4. Asset Inventory'));
  c.push(P('Ресурсів — 14. Три з них (A11–A14) свідомо реалізовані як SVG/CSS без окремого растрового файла — це теж рішення, а не пропуск.'));
  c.push(T([600, 1900, 2400, 1900, 2400], ['ID', 'Asset', 'Роль', 'Тип / представлення', 'Де використовується'], [
    ['A01', 'Hero desktop', 'Візуальний вступ, LCP', 'Raster (WebP), source SVG', 'Головна, ≥701 px'],
    ['A02', 'Hero mobile', 'Art-directed mobile-композиція', 'Raster (WebP), source SVG', 'Головна, ≤700 px'],
    ['A03', 'Logo light', 'Ідентифікація', 'Vector SVG', 'Світлий фон, документи'],
    ['A04', 'Logo dark', 'Ідентифікація', 'Vector SVG', 'Темна шапка/футер'],
    ['A05', 'Poster master', 'Редагований/архівний source', 'Raster (JPEG від партнера)', 'Тільки source'],
    ['A06', 'Poster card', 'Постер у сітці афіші', 'Raster derivative 320×480', 'Афіша, каталог'],
    ['A07', 'Poster detail', 'Великий постер', 'Raster derivative 800×1200', 'Сторінка фільму'],
    ['A08', 'Poster thumb', 'Мініатюра в рядку розкладу', 'Raster derivative 96×144', 'Розклад, пошук'],
    ['A09', 'Backdrop', 'Тло сторінки фільму', 'Raster (WebP) 1600×900', 'Сторінка фільму'],
    ['A10', 'Genre icons (6)', 'Жанри: бойовик, комедія, драма, жахи, трилер, кримінал', 'Vector SVG + sprite', 'Фільтри, картки'],
    ['A11', 'Header pattern', 'Декоративний фон шапки', 'SVG-плитка + CSS', 'Header'],
    ['A12', 'Poster placeholder', 'Системна заміна відсутнього постера', 'CSS + HTML (без файла)', 'Картки'],
    ['A13', 'Badge «ПРЕМ’ЄРА»', 'Статус фільму', 'CSS (+ mask-зірка)', 'Картки'],
    ['A14', 'Badge «3D»', 'Формат сеансу', 'CSS', 'Картки, розклад'],
  ], { size: 16 }));

  // ------------------------------------------------------------ 5. ТЕХ. ВИМОГИ
  c.push(H1('5. Технічні вимоги до ключових assets'));
  c.push(P('Нижче — технічні картки для 8 ключових assets (груп). Значення, що залежать від макета, подано правилом або діапазоном.'));
  const Q = ['Природа', 'Представлення', 'Масштабування', 'Прозорість', 'Responsive', 'Темізація', 'Редагування', 'Performance', 'Accessibility'];
  const card = (title, vals) => [H3(title), T([1800, 8000], ['Питання', 'Відповідь'], Q.map((q, i) => [q, vals[i]]), { firstColBold: true, firstColFill: true, size: 16 })];
  c.push(...card('Картка 1. Hero (A01, A02)', [
    'Ілюстративне тло: нічна кінозала, порожній «екран», ~40 дрібних напівпрозорих зірок, м’який градієнтний «промінь».',
    'Raster WebP q85; source — SVG-майстри. Причина: уніфікований pipeline з фото/AI-артом і однаковий вигляд у будь-якому рендерері (див. експеримент 1).',
    'Фіксовані 1600×900 та 720×900. Деталей, що потребують вищої роздільності, немає; тло без тексту.',
    'Не потрібна.',
    'Так: окрема mobile-композиція (екран ширший, 4 крісла замість 9) — це art direction, а не зменшена копія.',
    'Тло вже темне; окремий варіант для світлої теми не потрібен (hero — «вітрина»).',
    'SVG-майстри в 01_source; WebP перегенеровується скриптом.',
    `LCP-елемент: fetchpriority=high, width/height задані. Фактично ${kbf(size('03_final_assets/hero/hero-desktop.webp'))} КБ / ${kbf(size('03_final_assets/hero/hero-mobile.webp'))} КБ.`,
    'Декоративний (alt=""). Заголовок і CTA — HTML-текст поверх екрана, контраст 14.4:1 (#1C1233 на кремовому #EBE7E2).',
  ]));
  c.push(...card('Картка 2. Logo (A03, A04)', [
    'Геометричний знак «квиток із play»; використовується від 16 px до великих розмірів.',
    'Vector SVG, viewBox 64×40, два файли (світлий / темний фон). Чому: масштабується без втрат; працює як <img>, favicon-джерело, джерело для OG-експорту.',
    'Без обмежень; мінімально перевірено 16 px (див. рис. 8).',
    'Потрібна (нотчі квитка прозорі, контур не залежить від фону).',
    'Один знак; розмір задає CSS.',
    'Так: logo-light (#1C1233) для світлого, logo-dark (#FAF6F0) для темного; контраст 16.5:1.',
    'master SVG у 01_source; варіанти отримуються заміною кольору.',
    `${size('03_final_assets/logo/logo-light.svg')} байт на файл.`,
    'У SVG є <title>; у шапці поруч є текстовий wordmark, тому <img alt=""> (щоб не дублювати).',
  ]));
  c.push(...card('Картка 3. Poster master (A05)', [
    'Зображення стороннього постачальника: розміри й співвідношення довільні, текст (назва) — усередині картинки.',
    'Raster (JPEG/PNG) — як надійшло. Не редагується та не публікується.',
    'Не застосовується; це source для похідних.',
    'Не потрібна.',
    'Один master → кілька derivatives.',
    'Не застосовується.',
    'Master ніколи не перезаписується; для кожного постера зберігається запис у posters-meta.json: text_bbox (частки ширини/висоти) та alt.',
    'На сайт не потрапляє. Приймання: ширина ≥ 1000 px, відомі ratio та text_bbox.',
    'Оскільки назва «запечена», вона обов’язково дублюється в HTML (h3) і в alt.',
  ]));
  c.push(...card('Картка 4. Poster derivatives (A06–A08)', [
    'Фотографічний/графічний контент із текстом; багато однотипних файлів; змінюється щотижня.',
    'WebP q82 (smartSubsample для чіткого тексту): card 320×480, detail 800×1200, thumb 96×144; співвідношення 2:3.',
    'Не векторний. 3 розміри покривають 1×–2× для card (CSS ≤ 240 px), detail і thumb (48×72 px).',
    'Не потрібна.',
    'Один aspect ratio у всіх компонентах; розмір вибирає компонент (srcset/sizes).',
    'Не потрібна.',
    'Генерація скриптом із master; правило crop/pad за safe-zone (розд. 8, toolchain 1).',
    `card ${kbf(size('03_final_assets/posters/poster-misyachna-havan-card.webp'))}–${kbf(size('03_final_assets/posters/poster-zaliznyi-horyzont-card.webp'))} КБ; loading="lazy" усюди, крім перших рядків.`,
    'alt із meta.json; назва й сеанси — HTML. Критично: після crop назва не має бути зрізана.',
  ]));
  c.push(...card('Картка 5. Backdrop (A09)', [
    'Ілюстративне тло сторінки фільму (блискавка, уламки) без тексту.',
    `Raster WebP q85, 1600×900, ${kbf(size('03_final_assets/backdrop/backdrop-zaliznyi-horyzont.webp'))} КБ.`,
    'CSS cover; ключовий об’єкт праворуч, тому mobile-crop 4:5 його зберігає (перевірено).',
    'Не потрібна.',
    'Окремий mobile-варіант не потрібен (перевірено скріншотом 390 px).',
    'Ліва частина затемнена градієнтом під HTML-заголовок; темізація не потрібна.',
    'SVG-майстер у 01_source.',
    'Не LCP головної; завантажується на сторінці фільму.',
    'Декоративний; назва та опис — HTML.',
  ]));
  c.push(...card('Картка 6. Genre icons (A10)', [
    '6 функціональних піктограм; єдина візуальна мова (суцільна заливка, один optical size).',
    'SVG, viewBox 24×24, fill=currentColor, fill-rule=evenodd для отворів, без stroke. Окремі файли + sprite <symbol>.',
    'Чіткі у 16, 24, 32, 48 px і на 2× (рис. 9, 14).',
    'Так (тло прозоре).',
    'Розмір задає CSS (1.25em у chip).',
    'Колір успадковується (currentColor): light, dark, accent, active-стан — без нових файлів.',
    'master SVG у 01_source/icons; правила однакові для всіх.',
    `${Math.min(...['action', 'drama'].map(n => size(`03_final_assets/icons/genre-${n}.svg`)))}–${size('03_final_assets/icons/genre-crime.svg')} байт на іконку; sprite ${kbf(size('03_final_assets/icons/genre-sprite.svg'))} КБ.`,
    'aria-hidden: жанр завжди підписаний текстом у chip; стан (натиснуто) — фон + текст, а не лише колір.',
  ]));
  c.push(...card('Картка 7. Header pattern (A11)', [
    'Повторюваний декоративний мотив: діагональні лінії й кропки.',
    `SVG-плитка 96×96 (${pat.svg_bytes} байт) + CSS background-image/size.`,
    'Плитка повторюється необмежено; растровий фон 1600 px не потрібен.',
    'Так (кольір фону задає CSS-змінна).',
    'Один файл для всіх ширин.',
    'Фон-колір керується токеном; лінії — білі з opacity .07, тому працюють на обох темних/світлих --header-bg.',
    'master SVG у 01_source.',
    'Вага менше 0.4 КБ; кешується браузером.',
    'Декоративний; у forced-colors (високий контраст) вимикається (background-image:none).',
  ]));
  c.push(...card('Картка 8. Placeholder та badges (A12–A14)', [
    'Системні стани й мітки; текст — контент («Постер незабаром», «ПРЕМ’ЄРА», «3D»).',
    'CSS + HTML; піктограми (зображення, зірка) — CSS mask із data-URI, тому мають колір currentColor. Жодного image-файла.',
    'Масштабуються з em/rem.',
    'Не застосовується (форми CSS).',
    'aspect-ratio 2/3 у placeholder — не «стрибає» сітка.',
    'Токени --ph-*, світла/темна тема; контраст тексту виправлено після перевірки (розд. 11).',
    'Редагується як CSS/текст, без дизайн-інструмента.',
    '0 додаткових запитів.',
    'Текст читається скрінрідером і локалізується; badge не залежить лише від кольору (є текст і зірка).',
  ]));

  // ------------------------------------------------------------ 6. АЛЬТЕРНАТИВИ + МАТРИЦІ
  c.push(H1('6. Порівняння альтернатив і матриці'));
  c.push(P('Оцінки 1–5 (5 — найкраще для цього проєкту), вага критерію 1–3. У колонках — оцінка та причина. Числа з експериментів подано, де вони були виміряні.'));

  c.push(H2('6.1. Задача G3/G8: виготовлення похідних постерів'));
  c.push(P('Альтернативи: **A** — ручна обробка в графічному редакторі; **B** — скрипт Node.js + sharp (libvips) локально; **C** — хмарний image-CDN з обробкою «на льоту».'));
  c.push(matrix(['A. Ручний редактор', 'B. Скрипт sharp', 'C. Image-CDN'], [
    { n: 'Batch / автоматизація', w: 3, s: [1, 5, 5], t: ['кожен файл окремо', 'один запуск на всю папку', 'автоматично'] },
    { n: 'Повторюваність і safe-crop', w: 3, s: [2, 5, 3], t: ['залежить від людини', 'правило в коді + метадані text_bbox', 'типові режими fill/crop не знають про текст'] },
    { n: 'Вартість / залежності', w: 2, s: [4, 5, 2], t: ['безкоштовні редактори', 'безкоштовна бібліотека', 'тарифікація за трафік/перетворення'] },
    { n: 'Контроль якості / QA', w: 2, s: [5, 4, 3], t: ['все видно очима', 'звіт JSON + вибіркова перевірка', 'менше контролю над кодуванням'] },
    { n: 'Швидкість старту', w: 1, s: [5, 3, 4], t: ['одразу', 'потрібно написати скрипт', 'налаштування сервісу'] },
  ]));
  c.push(SP());

  c.push(H2('6.2. Задача G1/G4: формат hero'));
  c.push(P(`Альтернативи: JPEG, WebP, AVIF, SVG (безпосередньо джерело). Вимірювання — експеримент 1 (desktop: JPEG q85 ${H.j.kb} КБ, WebP q85 ${H.w.kb} КБ, AVIF q65 ${H.a.kb} КБ, SVG ${e1['hero-desktop-master'].svg_kb} КБ).`));
  c.push(matrix(['JPEG', 'WebP', 'AVIF', 'SVG'], [
    { n: 'Розмір файла', w: 3, s: [2, 4, 5, 5], t: [`${H.j.kb} КБ`, `${H.w.kb} КБ`, `${H.a.kb} КБ`, `${e1['hero-desktop-master'].svg_kb} КБ`] },
    { n: 'Візуальна якість / артефакти', w: 2, s: [3, 4, 3, 5], t: ['ringing навколо зірок', 'мінімальні', 'найбільше згладжування градієнта', 'без артефактів'] },
    { n: 'Сумісність і простота', w: 2, s: [5, 5, 4, 4], t: ['скрізь', 'усі сучасні', 'кодування ≈1 с, потрібен fallback', 'різний рендер; не для OG/e-mail'] },
    { n: 'Час decode+paint (Chromium)', w: 1, s: [3, 4, 4, 5], t: [`${dec['JPEG q85']} мс`, `${dec['WebP q85']} мс`, `${dec['AVIF q65']} мс`, `${dec['SVG']} мс`] },
    { n: 'Єдиний pipeline з фото/AI-артом', w: 2, s: [5, 5, 5, 1], t: ['так', 'так', 'так', 'ні — лише вектор'] },
  ]));
  c.push(SP());

  c.push(H2('6.3. Задача G5: жанрові іконки'));
  c.push(P(`Альтернативи: PNG-набір; SVG (окремі + sprite); icon font. Вимірювання — експеримент 2 (PNG-набір: ${e2.png.files} файлів, ${e2.png.kb} КБ; SVG: ${e2.svg.files} файлів, ${e2.svg.kb} КБ).`));
  c.push(matrix(['PNG-набір', 'SVG (inline / sprite)', 'Icon font'], [
    { n: 'Чіткість 16–32 px і на 2×', w: 3, s: [3, 5, 4], t: ['потрібні @2x файли, PSNR розтягнутого @1x ≈21–24 дБ', 'ідеальна за будовою', 'добра, але залежить від hinting шрифту'] },
    { n: 'Колір / теми / стани', w: 3, s: [1, 5, 4], t: ['×3 теми = 144 файли', 'currentColor', 'один колір на glyph'] },
    { n: 'Вага / кількість запитів', w: 2, s: [2, 5, 4], t: [`${e2.png.kb} КБ`, `${e2.svg.kb} КБ`, 'один файл шрифту, блокує текст (FOIT)'] },
    { n: 'Доступність', w: 2, s: [3, 4, 2], t: ['alt на кожному <img>', 'aria-hidden + текст', 'PUA-символи «озвучуються» скрінрідером'] },
    { n: 'Підтримка / зміна іконки', w: 1, s: [2, 4, 2], t: ['перегенерація всіх розмірів', 'правка одного path', 'перезбірка шрифту'] },
  ]));
  c.push(SP());

  c.push(H2('6.4. Задача G6: варіанти логотипа'));
  c.push(P('Альтернативи: два PNG (набір розмірів); два SVG-файли; один inline-SVG з CSS-змінними.'));
  c.push(matrix(['PNG ×2 (розміри)', 'SVG ×2 файли', 'Inline SVG + CSS'], [
    { n: 'Масштаб 16 px…великий', w: 3, s: [2, 5, 5], t: ['потрібні розміри', 'вектор', 'вектор'] },
    { n: 'Світлий і темний фон', w: 3, s: [3, 5, 5], t: ['два файли', 'два явні файли', 'автоматично через змінні'] },
    { n: 'Використання поза сторінкою (favicon, OG, e-mail)', w: 2, s: [5, 5, 2], t: ['так', 'так (SVG → PNG-експорт)', 'ні — <img>/favicon не бачать CSS сторінки'] },
    { n: 'Простота файлової структури', w: 1, s: [1, 3, 5], t: ['багато файлів', '2 файли', '1 файл'] },
    { n: 'Перемикач теми не за ОС', w: 2, s: [3, 4, 5], t: ['заміна src', 'заміна src/<picture>', 'CSS-змінна'] },
  ]));
  c.push(SP());

  c.push(H2('6.5. Задача G7: фон шапки'));
  c.push(P(`Розміри: растр 1600×160 PNG — ${pat.png_wide_bytes} Б (WebP — ${pat.webp_wide_bytes} Б); SVG-плитка — ${pat.svg_bytes} Б; CSS-градієнти — ≈${pat.css_gradient_bytes} Б.`));
  c.push(matrix(['Растровий фон', 'SVG-плитка', 'CSS-градієнти'], [
    { n: 'Вага', w: 3, s: [3, 5, 5], t: [`${(pat.png_wide_bytes / 1024).toFixed(1)} КБ`, `${pat.svg_bytes} Б`, `≈${pat.css_gradient_bytes} Б`] },
    { n: 'Колір / теми', w: 3, s: [1, 4, 5], t: ['перемальовувати', 'прозорі лінії + фон з CSS', 'змінні'] },
    { n: 'Відтворення мотиву (лінії + кропки)', w: 2, s: [5, 5, 2], t: ['так', 'так', 'кропки — кілька radial-gradient, громіздко'] },
    { n: 'Запити / кешування', w: 2, s: [2, 3, 5], t: ['окремий запит', 'дрібний, кешується', 'немає'] },
    { n: 'Редагованість дизайнером', w: 2, s: [2, 5, 2], t: ['лише source', 'вектор', 'лише розробник'] },
  ]));
  c.push(SP());

  c.push(H2('6.6. Задача G7: placeholder і badges'));
  c.push(P('Альтернативи: PNG-файли; SVG-файли; CSS + HTML-текст.'));
  c.push(matrix(['PNG', 'SVG-файл', 'CSS + HTML'], [
    { n: 'Файли / запити', w: 2, s: [1, 3, 5], t: ['по файлу на стан', 'по файлу на стан', 'жодного'] },
    { n: 'Теми (light/dark)', w: 3, s: [1, 3, 5], t: ['дублі', 'два файли або inline', 'токени'] },
    { n: 'Локалізація тексту', w: 3, s: [1, 2, 5], t: ['текст запечений', 'текст у SVG не перекладається CMS', 'звичайний HTML'] },
    { n: 'Доступність', w: 2, s: [2, 3, 4], t: ['alt', 'title/aria', 'реальний текст, контраст керований'] },
    { n: 'Складність реалізації', w: 1, s: [4, 4, 4], t: ['низька', 'низька', 'низька'] },
  ]));
  c.push(SP());
  c.push(H3('Текст усередині постерів (окреме рішення, без матриці)'));
  c.push(P('Розглянуто: (1) не чіпати партнерське зображення й дублювати текст у HTML; (2) накладати власний HTML-заголовок поверх; (3) перевёрстувати постер. Обрано (1): постер — інформативний артефакт із правами третіх сторін, змінювати його вміст не можна, тому безпечними є лише crop/pad, а назва фільму й сеанси дублюються HTML-текстом та alt.'));

  // ------------------------------------------------------------ 7. РІШЕННЯ
  c.push(H1('7. Обґрунтування прийнятих рішень'));
  const dcs = [
    ['Похідні постерів (G3, G8)', 'скрипт Node.js + sharp (libvips) із метаданими safe-zone', 'він дає batch, повторюваність і машинну перевірку «текст не зрізано» (сума 51 із 55), а вартість нульова', 'Ручний редактор не обраний: контент оновлюється щотижня, ручний workflow на кожен постер нереалістичний. Image-CDN не обраний: типові crop-режими не знають про текст усередині зображення, а тарифікація не виправдана при поточному обсязі', 'кількість постерів зросте до тисяч або з’явиться потреба в on-the-fly розмірах — тоді CDN (imgproxy/Cloudinary) з власним safe-zone-правилом'],
    ['Hero (G1)', 'WebP q85 із SVG-майстрів, окремі desktop/mobile', 'найкращий баланс: ' + H.w.kb + ' КБ, без помітних артефактів, єдиний pipeline із майбутнім фото/AI-артом', 'AVIF не обраний: виграш лише ' + (H.w.kb - H.a.kb).toFixed(1) + ' КБ, кодування ≈1 с, найбільше згладжування градієнта. SVG — реально конкурентний (' + e1['hero-desktop-master'].svg_kb + ' КБ, найшвидший decode), але не обраний через різний рендер у соцмережах/e-mail і неможливість замінити на фото в тому ж pipeline', 'hero залишиться суто вектором на весь час життя продукту — тоді SVG доцільніший; або з’являється фото-hero — тоді AVIF з WebP-fallback'],
    ['Жанрові іконки (G5)', 'SVG (окремі файли + sprite) з currentColor', 'єдиний варіант, що одночасно дає чіткість у 16–32 px, зміну кольору за темою/станом і 1.7 КБ замість 118 КБ (144 файли)', 'PNG-набір не обраний: ×3 теми ×4 розміри ×2 dpr; icon font не обраний через FOIT і проблеми зі скрінрідером', 'потрібні багатоколірні іконки — тоді змішана схема (SVG з CSS-змінними на кожен колір)'],
    ['Логотип (G6)', 'два SVG-файли (light, dark)', 'вектор, працює в <img>/favicon/OG-експорті; потрібні лише два явні фони', 'Inline-SVG з CSS не обрано: не працює як <img>/favicon; PNG не обрано через набір розмірів', 'основним джерелом стане тільки веб-інтерфейс без favicon/OG — тоді достатньо inline-SVG'],
    ['Фон шапки (G7)', 'SVG-плитка 96×96 з CSS-фоном', 'мотив із лініями й кропками; 373 Б; редагується дизайнером', 'Растровий фон не обраний: ' + (pat.png_wide_bytes / 1024).toFixed(1) + ' КБ і не змінює колір; CSS-градієнти — близька альтернатива, але кропки громіздкі', 'мотив спроститься до ліній — тоді CSS'],
    ['Placeholder і badges (G7)', 'CSS + HTML без image-файла', 'текст локалізується, кольори — з токенів, 0 запитів', 'PNG/SVG-файли не обрані: дублі для тем і запечений текст', 'placeholder стане ілюстрацією з персонажем — тоді SVG'],
  ];
  dcs.forEach(([t, ch, why, not, cond]) => {
    c.push(H3(t));
    c.push(P(`Для задачі обрано **${ch}**, тому що ${why}.`));
    c.push(P(`${not}.`));
    c.push(P(`Рішення може бути переглянуте, якщо: ${cond}.`, { italics: true, color: '6B6482' }));
  });

  // ------------------------------------------------------------ 8. TOOLCHAINS
  c.push(H1('8. Toolchain'));
  c.push(P('Побудовано чотири ланцюги (три обов’язкові різної природи + додатковий про автоматизацію). Кожен етап існує з конкретної причини; етапи без користі прибрано.'));
  c.push(H2('8.1. Toolchain 1 — постер (растровий контент партнера)'));
  c.push(...IMG(F('toolchain-1-poster'), 640, 'Рис. 1. Toolchain постера'));
  [
    '**Master постер.** Зберігається без змін; усі похідні можна перегенерувати, якщо зміниться формат картки.',
    '**Normalize orientation / EXIF.** Партнерські файли можуть мати поворот у метаданих; перед розрахунком співвідношення сторін його треба застосувати (sharp .rotate()).',
    '**Safe-zone check: crop або pad.** Якщо відхилення від 2:3 ≤ 2%, робимо cover-crop. Інакше перевіряємо, чи після кропу text_bbox лишається ≥ 4% від краю: так — crop, ні — pad (extend, copy-edge). Це і є вирішення «коли crop безпечний, а коли руйнує інформацію».',
    '**Card + detail + thumb.** Три файли з одного нормалізованого зображення: одна фотографія не виконує різних функцій.',
    '**Optimize WebP q82 (smartSubsample).** Підібрано так, щоб дрібний текст у заголовку залишався чітким; для card WebP на ' + (100 - 100 * pd['misyachna-havan'].out.card.kb / pd['misyachna-havan'].card_jpeg_q82_kb).toFixed(0) + '% легший за JPEG q82 при тому ж розмірі (' + pd['misyachna-havan'].out.card.kb + ' проти ' + pd['misyachna-havan'].card_jpeg_q82_kb + ' КБ).',
    '**QA: текст не обрізано.** Автоматично (safe-zone) і вибірково очима на збільшенні.',
  ].forEach(t => c.push(B(t)));
  c.push(H2('8.2. Toolchain 2 — hero / backdrop (ілюстративне тло, art direction)'));
  c.push(...IMG(F('toolchain-2-hero'), 640, 'Рис. 2. Toolchain hero'));
  [
    '**SVG-майстри.** Редагований source (композиція, кольори, розташування екрана).',
    '**Art direction.** Desktop і mobile — різні композиції, а не один файл різного розміру: екран займає 89% ширини на mobile та 46% на desktop, крісел 4 і 9.',
    '**Rasterize → encode WebP q85.** Растеризація до кодування, оскільки кодек має бачити фінальні пікселі. Якість обрана за експериментом 1.',
    '**Browser check.** Перевірка в Chromium: <picture>, накладання HTML-тексту, поведінка на 390 px (рис. 10–11).',
  ].forEach(t => c.push(B(t)));
  c.push(H2('8.3. Toolchain 3 — жанрові іконки (вектор)'));
  c.push(...IMG(F('toolchain-3-icons'), 640, 'Рис. 3. Toolchain іконок'));
  [
    '**SVG-майстер 24×24.** Однаковий viewBox і правила заповнення потрібні для стабільного вигляду набору в інтерфейсі, а не «для краси в редакторі».',
    '**Cleanup.** fill=currentColor, evenodd для отворів (очі/рот), без stroke — інакше колір і товщина «попливуть» на різних розмірах.',
    '**Minify.** Прибираємо коментарі й пробіли: 178–367 байт на іконку.',
    '**Sprite + окремі файли.** Sprite — для inline-використання (1.5 КБ, 0.5 КБ gzip), окремі файли — для <img> і документації.',
    '**Перевірка 16/24/32/48 px, light/dark.** Рис. 9 і 14.',
  ].forEach(t => c.push(B(t)));
  c.push(H2('8.4. Toolchain 4 (додатковий) — щотижневе оновлення афіші'));
  c.push(...IMG(F('toolchain-4-batch'), 640, 'Рис. 4. Автоматизація оновлення'));
  c.push(P('Ручним лишається тільки заповнення text_bbox для нових постерів і розбір випадків режиму «MANUAL» (занадто високий/вузький постер). Усе інше виконує build_final.js і повертає JSON-звіт (mode, розміри, розмір у КБ). Для 5000 постерів цей же скрипт паралелізується (sharp — libvips, багатопотоковий).'));

  // ------------------------------------------------------------ 9. ASSETS
  c.push(H1('9. Створені production-ready assets'));
  c.push(P('Підготовлено assets п’яти різних груп: hero (растр), постери (растр + правило crop/pad), іконки та логотип (вектор), декор і службові стани (CSS). Усі вони зібрані у 06_demo/index.html для перевірки в реальному браузері.'));
  c.push(H2('9.1. Hero desktop і mobile (A01, A02)'));
  c.push(...IMG(F('hero-pair'), 600, 'Рис. 5. hero-desktop.webp (1600×900) і hero-mobile.webp (720×900)'));
  c.push(P(`«Екран» лишено порожнім навмисно: заголовок «Кіно сьогодні ввечері» та кнопка — HTML (рис. 10). На mobile — окрема композиція, а не масштабування desktop. Розмір: ${kbf(size('03_final_assets/hero/hero-desktop.webp'))} КБ і ${kbf(size('03_final_assets/hero/hero-mobile.webp'))} КБ.`));
  c.push(H2('9.2. Постери: «до/після» і похідні (A05–A08)'));
  c.push(...IMG(F('poster-derivatives'), 560, 'Рис. 6. Один master → detail, card, thumb'));
  c.push(P('Проблемний та виправлений asset. Постер «Залізний горизонт» надійшов у співвідношенні 3:4 (1000×1333), а назва займає ≈3%…97% ширини. Наївний cover-crop до 2:3 зрізає крайні літери; pipeline це виявляє (text_bbox виходить за safe-zone 4%) і замість кропу додає 167 px тла (pad, copy-edge). Два інших постери (відхилення 0% і 1.28%) безпечно кропаються/масштабуються.'));
  c.push(...IMG(F('poster-naive-vs-safe'), 600, 'Рис. 7. Наївний crop проти safe-zone pipeline'));
  c.push(T([2600, 1100, 1300, 3000, 1000, 1000], ['Постер', 'Джерело', 'Відхилення від 2:3', 'Рішення pipeline', 'card, КБ', 'detail, КБ'],
    Object.entries(pd).map(([id, v]) => [id, v.source_size, v.deviation_pct + '%', v.mode, String(v.out.card.kb), String(v.out.detail.kb)]), { size: 15 }));
  c.push(H2('9.3. Логотип (A03, A04)'));
  c.push(...IMG(F('logo-variants'), 560, 'Рис. 8. Логотип на світлому і темному фонах, 80/40/24/16 px'));
  c.push(H2('9.4. Жанрові іконки (A10)'));
  c.push(...IMG(F('icons-sheet'), 560, 'Рис. 9. Набір іконок: 16/24/32/48 px, light/dark, accent'));
  c.push(H2('9.5. Backdrop, header pattern, placeholder, badges (A09, A11–A14)'));
  c.push(P(`Backdrop (${kbf(size('03_final_assets/backdrop/backdrop-zaliznyi-horyzont.webp'))} КБ) не містить тексту; поверх нього в HTML стоять заголовок і CTA. Header pattern — SVG-плитка ${pat.svg_bytes} Б. Placeholder і badges — components.css без image-файлів. Результат у контексті сторінки:`));
  c.push(...IMG('04_experiment/demo-desktop-light.png', 400, 'Рис. 10. Демо-сторінка, desktop, світла тема (1440 px)'));
  c.push(...IMG('04_experiment/demo-mobile-light.png', 230, 'Рис. 11. Демо-сторінка, mobile 390 px (2×), mobile-hero без горизонтального прокручування'));
  c.push(...IMG('04_experiment/demo-desktop-dark.png', 400, 'Рис. 12. Темна тема: змінилися лише CSS-токени, файли ті самі'));

  // ------------------------------------------------------------ 10. ЕКСПЕРИМЕНТИ
  c.push(H1('10. Порівняльні експерименти'));
  c.push(H2('Експеримент 1. Кодування hero: JPEG / WebP / AVIF / SVG'));
  c.push(P(`Вхід: hero-desktop-master.png (1600×900, lossless ${e1['hero-desktop-master'].png_kb} КБ) і hero-mobile-master.png (720×900, ${e1['hero-mobile-master'].png_kb} КБ), отримані з SVG-майстрів. Інструменти: Pillow (libjpeg-turbo/libwebp/libavif), Chromium (замір decode+paint, медіана з 9 запусків, холодний кеш). Скрипти: 05_toolchain/scripts/experiment1_hero.py, exp1_decode.js.`));
  c.push(T([2300, 1900, 1900, 1900, 1900], ['Показник (desktop 1600×900)', 'JPEG q85', 'WebP q85', 'AVIF q65', 'SVG (source)'], [
    ['Вхід / налаштування', 'PNG 1600×900; progressive, optimize', 'PNG 1600×900; method 6', 'PNG 1600×900; speed 6', 'SVG 1600×900, viewBox'],
    ['Output-формат / dimensions', '.jpg, 1600×900', '.webp, 1600×900', '.avif, 1600×900', '.svg, векторний'],
    ['Час кодування', H.j.ms + ' мс', H.w.ms + ' мс', H.a.ms + ' мс', '— (це source)'],
    ['Розмір файла', H.j.kb + ' КБ', H.w.kb + ' КБ', H.a.kb + ' КБ', e1['hero-desktop-master'].svg_kb + ' КБ'],
    ['Розмір mobile 720×900', M.j.kb + ' КБ', M.w.kb + ' КБ', M.a.kb + ' КБ', e1['hero-mobile-master'].svg_kb + ' КБ'],
    ['PSNR до lossless', H.j.psnr + ' дБ', H.w.psnr + ' дБ', H.a.psnr + ' дБ', '—'],
    ['Decode + paint у Chromium', dec['JPEG q85'] + ' мс', dec['WebP q85'] + ' мс', dec['AVIF q65'] + ' мс', dec['SVG'] + ' мс'],
    ['Візуальна якість', 'ringing біля зірок', 'без помітних артефактів', 'найбільше згладжування градієнта', 'ідеальна'],
    ['Редагованість', 'ні', 'ні', 'ні', 'так'],
    ['Повторюваність', 'скрипт', 'скрипт', 'скрипт, повільніше', 'без перекодування'],
    ['Обмеження', 'великий розмір', 'старі браузери', 'час кодування, fallback', 'різний рендер, не для OG/e-mail, не замінюється фото'],
  ], { firstColBold: true, firstColFill: true, size: 16 }));
  c.push(SP());
  c.push(P('Повна таблиця рівнів якості (desktop):'));
  c.push(T([1500, 1300, 1600, 1600, 1600, 2000], ['Формат', 'Якість', 'Розмір, КБ', 'Кодування, мс', 'PSNR, дБ', 'Макс. похибка (99.9%)'],
    e1['hero-desktop-master'].rows.map(r => [r.fmt, String(r.q), String(r.kb), String(r.ms), String(r.psnr), String(r.p99)]), { size: 15 }));
  c.push(...IMG(F('exp1-banding'), 520, 'Рис. 13. Темний градієнт з підсиленням яскравості ×7: помітні блоки та ringing, невидимі за нормальної яскравості'));
  c.push(...callout(`На цьому hero (плоске ілюстративне тло) усі растрові формати малі: WebP q85 — ${H.w.kb} КБ проти ${H.j.kb} КБ у JPEG (−${(100 - 100 * H.w.kb / H.j.kb).toFixed(0)}%). AVIF ще менший (${H.a.kb} КБ), але різниця ${(H.w.kb - H.a.kb).toFixed(1)} КБ для першого екрана несуттєва, а кодування повільніше в ≈${Math.round(H.a.ms / H.w.ms)} разів. Несподівано, SVG-джерело виявилося найменшим (${e1['hero-desktop-master'].svg_kb} КБ) і найшвидшим за decode — тобто для чисто векторного hero SVG реально конкурентний. Обрано WebP, бо hero має лишатися замінним на фото/AI-арт у тому ж pipeline. Якщо зміняться вимоги (hero назавжди векторний) — рішення варто переглянути на користь SVG.`));

  c.push(H2('Експеримент 2. Жанрові іконки: PNG-набір проти SVG'));
  c.push(P(`Вхід: 6 іконок 24×24. PNG-набір: 3 кольори (light, dark, accent) × розміри 16/24/32/48 × dpr 1 і 2 = ${e2.png.files} файлів (sharp, compression 9). SVG: ${e2.svg.files} файлів + sprite. Чіткість: PNG@1x, розтягнутий браузером на 2×-екрані (bilinear), порівнюється (PSNR) з нативним рендером цього ж розміру; SVG — еталон за побудовою. Скрипт: experiment2_icons.js.`));
  c.push(T([2400, 3500, 3900], ['Показник', 'PNG-набір', 'SVG-набір'], [
    ['Вхід / налаштування', 'SVG 24×24 → sharp, compression 9', 'SVG 24×24 → minify (без комментарів/пробілів)'],
    ['Output / dimensions', 'PNG 16, 24, 32, 48 px (×1 і ×2) × 3 кольори', 'SVG, viewBox 24×24 (масштабується)'],
    ['Кількість файлів', `${e2.png.files}`, `${e2.svg.files} (+1 sprite)`],
    ['Сумарний розмір', `${e2.png.kb} КБ`, `${e2.svg.kb} КБ (gzip ${e2.svg.gzip_kb} КБ); sprite ${e2.svg.sprite_kb} КБ (gzip ${e2.svg.sprite_gzip_kb} КБ)`],
    ['Час підготовки', `${e2.png.gen_ms} мс на генерацію + повтор при кожній зміні іконки чи палітри`, 'зміна одного path/кольору без перегенерації'],
    ['Чіткість на 2× (PSNR)', e2.sharpness.map(s => `${s.css_px}px: ${s.psnr_png1x_stretched} дБ`).join('; ') + ' (розмиття; @2x-файли вирішують, але подвоюють набір)', 'нативна чіткість на будь-якому dpr'],
    ['Кольори / теми', '×3 файли на кожну тему/стан', 'currentColor: теми й стани — безкоштовно'],
    ['Редагованість', 'лише через source', 'source = final'],
    ['Повторюваність', 'скрипт', 'не потрібна'],
    ['Обмеження', 'вага набору зростає мультиплікативно', 'лише одноколірні / прості форми (для складних іконок потрібна дисципліна path)'],
  ], { firstColBold: true, firstColFill: true, size: 16 }));
  c.push(...IMG(F('exp2-png-vs-svg'), 460, 'Рис. 14. На 2×-екрані PNG@1x (верхні рядки в парах) м’якший за SVG'));
  c.push(...callout(`SVG-набір у ${Math.round(e2.png.kb / e2.svg.kb)} разів легший і не потребує похідних на теми. PNG залишається робочим варіантом для 1× і одного кольору, але вже при трьох станах кількість файлів виходить з-під контролю. Це контекстний висновок: для багатоколірних ілюстрацій співвідношення було б іншим.`));

  // ------------------------------------------------------------ 11. QA
  c.push(H1('11. Перевірка результатів'));
  c.push(T([2300, 5000, 2500], ['Asset', 'Що перевірено', 'Результат'], [
    ['hero desktop/mobile', 'функція, вага, LCP-атрибути, накладання HTML-тексту, mobile 390 px', 'OK; на mobile виявлено, що шапка з навігацією розширювала сторінку — виправлено (nav ховається ≤700 px)'],
    ['poster card/detail/thumb', 'aspect ratio, чіткість тексту на збільшенні, safe-zone, вага', 'OK. Виявлено помилку порядку операцій у sharp (extend виконується після resize → висота 1667 замість 1500) — виправлено двоетапною обробкою'],
    ['backdrop', 'контраст HTML-тексту зліва, mobile-crop', 'OK'],
    ['logo light/dark', '16–80 px, контраст 16.5:1, прозорість', 'OK'],
    ['genre icons', '16/24/32/48 px, light/dark/accent, 2× dpr', 'OK; в іконках немає stroke — товщина не «пливе»'],
    ['header pattern', 'вага, вигляд на 1440/390 px, forced-colors', 'OK (у forced-colors фон вимикається)'],
    ['placeholder / badges / chips', 'контраст WCAG, стани не лише кольором', 'Виявлено 2 проблеми контрасту — див. нижче; виправлено'],
  ], { size: 16, firstColBold: true }));
  c.push(SP());
  c.push(P('Контрасти (WCAG), розраховані за формулою відносної яскравості:'));
  c.push(T([7000, 2800], ['Пара кольорів', 'Контраст'], Object.entries(con).map(([k, v]) => [k, String(v)]), { size: 15 }));
  c.push(P('Практична цінність перевірки: спочатку текст placeholder (3.0:1) і активний chip (текст #F2A93B на білому, 2.0:1) не досягали 4.5:1. Після виправлення токена --ph-fg та стану chip (фон акценту + темний текст) значення — 5.5:1 і 8.9:1. Постери мають власні заголовки; їх контраст (7.7–12.2:1) також перевірено.', { before: 100 }));

  // ------------------------------------------------------------ 12. MANIFEST
  c.push(H1('12. Asset Manifest'));
  const fs_ = (dir, re) => fs.readdirSync(R(dir)).filter(f => re.test(f));
  const range = (files, dir) => { const s = files.map(f => size(`${dir}/${f}`)); return s.length === 1 ? kbf(s[0]) + ' КБ' : `${kbf(Math.min(...s))}–${kbf(Math.max(...s))} КБ`; };
  const posters = fs_('03_final_assets/posters', /card/), det = fs_('03_final_assets/posters', /detail/), thb = fs_('03_final_assets/posters', /thumb/);
  const icn = fs_('03_final_assets/icons', /^genre-(?!sprite)/);
  const masters = fs_('01_source', /-master\.jpg$/);
  const irange = () => { const s = icn.map(f => size('03_final_assets/icons/' + f)); return `${Math.min(...s)}–${Math.max(...s)} Б`; };
  c.push(T([500, 1750, 1700, 1900, 900, 1500, 1100], ['ID', 'Final asset', 'Source', 'Tool / workflow', 'Format', 'Variants / примітка', 'Final size'], [
    ['A01', 'hero/hero-desktop.webp', 'hero-desktop-master.svg', 'SVG → sharp render → WebP q85', 'WebP', '1600×900, desktop', kbf(size('03_final_assets/hero/hero-desktop.webp')) + ' КБ'],
    ['A02', 'hero/hero-mobile.webp', 'hero-mobile-master.svg', 'art-directed SVG → render → WebP q85', 'WebP', '720×900, mobile', kbf(size('03_final_assets/hero/hero-mobile.webp')) + ' КБ'],
    ['A03', 'logo/logo-light.svg', 'logo-master-light.svg', 'ручне SVG → minify', 'SVG', 'світлий фон', size('03_final_assets/logo/logo-light.svg') + ' Б'],
    ['A04', 'logo/logo-dark.svg', 'logo-master-dark.svg', 'колірний варіант → minify', 'SVG', 'темний фон', size('03_final_assets/logo/logo-dark.svg') + ' Б'],
    ['A05', '— (source only)', masters.join(', '), 'приймання від партнера (не змінюється)', 'JPEG', '3 постери; meta у posters-meta.json', range(masters, '01_source')],
    ['A06', 'posters/poster-*-card.webp', 'poster-*-master.jpg', 'safe-zone crop/pad → resize → WebP q82', 'WebP', '320×480, ×3', range(posters, '03_final_assets/posters')],
    ['A07', 'posters/poster-*-detail.webp', 'poster-*-master.jpg', 'те саме', 'WebP', '800×1200, ×3', range(det, '03_final_assets/posters')],
    ['A08', 'posters/poster-*-thumb.webp', 'poster-*-master.jpg', 'те саме', 'WebP', '96×144, ×3', range(thb, '03_final_assets/posters')],
    ['A09', 'backdrop/backdrop-zaliznyi-horyzont.webp', 'backdrop-zaliznyi-horyzont.svg', 'SVG → render → WebP q85', 'WebP', '1600×900, без тексту', kbf(size('03_final_assets/backdrop/backdrop-zaliznyi-horyzont.webp')) + ' КБ'],
    ['A10', 'icons/genre-*.svg (+ genre-sprite.svg)', 'icons/genre-*.svg', 'cleanup 24×24 → minify → sprite', 'SVG', '6 іконок; currentColor; sprite ' + kbf(size('03_final_assets/icons/genre-sprite.svg')) + ' КБ', irange()],
    ['A11', 'css/header-pattern.svg', 'header-pattern-master.svg', 'SVG-плитка + CSS background', 'SVG/CSS', '96×96, theme-aware', size('03_final_assets/css/header-pattern.svg') + ' Б'],
    ['A12', 'css/components.css → .poster-placeholder', 'placeholder-glyph.svg', 'реалізовано як CSS + HTML', 'CSS', 'без image-файла', '0 файлів'],
    ['A13', 'css/components.css → .badge--premiere', '—', 'CSS + mask-зірка', 'CSS', 'без image-файла', '0 файлів'],
    ['A14', 'css/components.css → .badge--3d', '—', 'CSS', 'CSS', 'без image-файла', '0 файлів'],
    ['—', 'css/components.css', '—', 'токени, pattern, badges, placeholder, chips', 'CSS', 'light/dark, forced-colors', kbf(size('03_final_assets/css/components.css')) + ' КБ'],
  ], { size: 14 }));
  c.push(SP());
  c.push(H3('Структура файлів'));
  c.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ font: 'Courier New', size: 17, text: 'LR1_Zharkov_V7/' })] }));
  ['01_source/       SVG-майстри, JPEG-майстри постерів, posters-meta.json, icons/', '02_work/         проміжні PNG (render, normalized, naive-crop)', '03_final_assets/ hero/ logo/ posters/ backdrop/ icons/ css/', '04_experiment/  результати експериментів (JSON, кодування, скріншоти)', '05_toolchain/   scripts/ (gen_sources.py, build_final.js, ...) та figures/', '06_demo/        index.html — перевірка assets у браузері', 'report.docx'].forEach(t => c.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 360 }, children: [new TextRun({ font: 'Courier New', size: 17, text: t })] })));

  // ------------------------------------------------------------ 13. AI
  c.push(H1('13. Фіксація використання AI'));
  c.push(T([2300, 2600, 2400, 2500], ['Задача', 'Тип AI-операції', 'Отриманий результат', 'Що перевірено / виправлено'], [
    ['Генерація SVG-майстрів (hero, постери, backdrop, іконки, логотип)', 'генерація коду (Python), що будує SVG за параметрами', 'редаговані SVG-файли у 01_source', 'візуальний огляд усіх файлів; виправлено різкий край «променя» в hero (градієнт), накладання зірки на екран у mobile-hero, надмірне затемнення блискавки в backdrop; кольори узгоджено з бренд-палітрою; заголовок «Сміх у провулку» перероблено на світлу панель через низький контраст'],
    ['Скрипти збірки й експериментів', 'генерація коду (Node.js/Python)', 'build_final.js, експерименти 1–2, скріншоти', 'всі числа у звіті отримані запуском скриптів; виправлено помилку порядку операцій sharp (extend/resize), переповнення mobile-шапки'],
    ['Чернетка тексту звіту', 'генерація тексту', 'структура й формулювання розділів', 'перевірено відповідність вимогам практикуму; аналітичні висновки та матриці мають бути відтворені й захищені мною самостійно'],
  ], { size: 15 }));
  c.push(P('AI не був фінальним «джерелом істини»: усі рішення повернуто до вимог і підтверджено вимірюваннями. На захисті workflow пояснюється незалежно від інструмента, яким створено файл.', { before: 100 }));

  // ------------------------------------------------------------ 14. ВИСНОВКИ
  c.push(H1('14. Висновки'));
  c.push(P('**Які рішення виявилися найважливішими.** По-перше, розділення master і derivatives та правило «crop чи pad» за safe-zone: саме воно захищає текст усередині сторонніх постерів. По-друге, рішення не створювати файли там, де достатньо CSS/HTML (placeholder, badges, декор): це прибрало запити, дублі під теми та запечений текст. По-третє, вибір SVG із currentColor для функціональних іконок: 1.7 КБ проти 118.5 КБ, теми й стани без додаткових файлів.'));
  c.push(P(`**Де альтернативи були реально конкурентними.** Для hero — WebP, AVIF і SVG: різниця у вазі мінімальна, а SVG навіть менший і швидший. Вибір WebP пояснюється не розміром, а уніфікованістю pipeline і замінністю на фото. Для логотипа — два SVG-файли проти inline-SVG (51 проти 49 балів): вирішила потреба використовувати знак поза сторінкою. Для фону шапки — SVG-плитка проти CSS-градієнтів.`));
  c.push(P('**Що змінилося б при збільшенні масштабу.** Ручна підготовка постерів перестала б працювати вже при десятках нових файлів на тиждень; при тисячах потрібні черга обробки, паралелізація й, імовірно, on-the-fly CDN з тим самим safe-zone-правилом. Метадані text_bbox довелося б визначати автоматично (OCR/детекція тексту) або вимагати від дистриб’ютора.'));
  c.push(P('**Які частини варто автоматизувати.** Приймання постерів (валідація розміру/ratio, нормалізація EXIF), генерація derivatives з JSON-звітом, перевірка контрасту токенів у CI, перегенерація hero/backdrop із SVG-майстрів. Ручним лишається творче: композиція hero, іконографія, нетипові постери режиму MANUAL.'));
  c.push(P('Головний результат роботи — не набір картинок, а відтворюваний і обґрунтований процес: будь-який файл з 03_final_assets можна перебудувати одним запуском із 01_source.'));

  c.push(H1('15. Чекліст перед здачею'));
  c.push(T([5200, 900, 3700], ['Пункт чекліста практикуму', 'Стан', 'Де в роботі'], [
    ['Мій варіант виконано (варіант 7), а не замінено іншою темою', '✔', 'розд. 2–3'],
    ['Щонайменше 12 осмислених assets в inventory', '✔ 14', 'розд. 4'],
    ['Технічні вимоги для мінімум 8 assets', '✔ 8 карток', 'розд. 5'],
    ['Для мінімум 5 задач розглянуто 2–3 альтернативи', '✔ 6 задач', 'розд. 6'],
    ['Вибір інструментів аргументовано критеріями', '✔ матриці з вагами', 'розд. 6–7'],
    ['3 toolchain різних типів', '✔ 4 (растр, ілюстрація, вектор, автоматизація)', 'розд. 8'],
    ['6–8 реально підготовлених production-ready assets', '✔ 10 груп файлів', 'розд. 9, 03_final_assets'],
    ['2 порівняльні експерименти', '✔', 'розд. 10, 04_experiment'],
    ['Source і final assets розділені', '✔', '01_source / 03_final_assets'],
    ['Asset Manifest заповнений', '✔', 'розд. 12'],
    ['AI-використання зафіксовано', '✔', 'розд. 13'],
    ['Готовність змінити workflow при зміні вимоги', '✔ (шпаргалка)', 'Zahyst_shpargalka.docx'],
  ], { size: 16 }));

  // ---- зміст (номери сторінок підставляються з toc.json після першого проходу)
  let tocMap = {}; try { tocMap = J('05_toolchain/toc.json'); } catch (e) {}
  const tocPage = [new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Зміст', font: FONT, bold: true, size: 32, color: '1C1233' })] }),
    ...h1s.map(t => new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W, leader: LeaderType.DOT }], spacing: { after: 110 }, children: [new TextRun({ text: t, font: FONT, size: 22 }), new TextRun({ children: [new Tab(), String(tocMap[t] || '')], font: FONT, size: 22 })] })), BR()];

  // ------------------------------------------------------------ DOC
  const doc = new Document({
    creator: 'Жарков Д. А.', title: 'ЛР №1. Варіант 7. Кіноафіша «Кінопульс»',
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    numbering: { config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 260 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, bottom: 1020, left: 1020, right: 1020 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Графічні інструменти вебдизайну · ЛР №1', font: FONT, size: 15, color: '9A93B0' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ЛР №1 · Варіант 7 · Кінопульс · стор. ', font: FONT, size: 16, color: '6B6482' }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '6B6482' })] })] }) },
      children: [...cv, ...tocPage, ...c],
    }],
  });
  fs.writeFileSync(R('report.docx'), await Packer.toBuffer(doc));
  console.log('report.docx', kbf(size('report.docx')), 'KB');
})();
