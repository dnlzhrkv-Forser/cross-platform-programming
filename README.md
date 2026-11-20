# ФармаОнлайн: монорепозиторій (ЛР 7–8)

Спільне ядро `@farmaonline/core` + веб-клієнт + мобільний клієнт (React Native / Expo) + десктопний клієнт (Electron). Сутність — препарат
(`name`, `price`, `quantity`, `createdAt`); у ядрі перевірка, пошук, сортування та сервіс `MedicinesService`,
у клієнтах — лише інтерфейс і адаптер збереження.

```
packages/
  core/      @farmaonline/core: medicineValidation, medicineUtils, storageAdapter, medicinesService, index, test/
  web/       farmaonline-web: LocalStorageAdapter (localStorage), server.js (node:http), index.html, script.js, test/
  mobile/    farmaonline-mobile: AsyncStorageAdapter (AsyncStorage), App.js, index.js, app.json, test/
  desktop/   farmaonline-monorepo-desktop: FileStorageAdapter (medicines.json), main.js, preload.cjs, ipcHandlers.js, renderer/, test/
```

| Платформа | Адаптер | Де зберігаються дані |
| --- | --- | --- |
| Тести | `MemoryStorageAdapter` (ядро) | у пам'яті |
| Веб | `LocalStorageAdapter` | `localStorage`, ключ `farmaonline-medicines` |
| Мобільний | `AsyncStorageAdapter` | `AsyncStorage` на пристрої, ключ `farmaonline-medicines` |
| Десктоп | `FileStorageAdapter` | `medicines.json` у теці `userData` |

## Запуск (завжди з кореня)

```bash
npm install            # залежності й символьне посилання node_modules/@farmaonline/core -> packages/core
npm test               # тести всіх пакетів
npm run start:web      # http://localhost:3000
npm run start:mobile   # Expo: QR-код для Expo Go (Android / iOS)
npm run start:desktop  # вікно Electron
npm test -w @farmaonline/core   # лише ядро
```

## Перевірка спільності коду (завдання 9)

У `packages/core/medicineValidation.js` змініть `MAX_NAME_LENGTH` (100 → 20) або текст `ERROR_EMPTY`,
перезапустіть обидва клієнти — нове правило діє в обох без змін у їхньому коді. Поверніть значення й виконайте `npm test`.

## Технологічний стек і компетентності

### Стек за рівнями архітектури

| Рівень | Технології | Де реалізовано |
| --- | --- | --- |
| 1. Платформи | Браузер (WebView), Windows / macOS / Linux, Android / iOS | [`packages/web`](packages/web), [`packages/mobile`](packages/mobile), [`packages/desktop`](packages/desktop) |
| 2. Клієнти | HTML, CSS, JavaScript (import map), React Native + Expo, Electron (main · preload · renderer, IPC) | [`packages/web`](packages/web), [`packages/mobile`](packages/mobile), [`packages/desktop`](packages/desktop) |
| 3. Спільний код | ES-модулі, npm workspaces, `MedicinesService` + адаптери сховища, `node --test` | [`packages/core`](packages/core) |
| 3. Адаптери | `LocalStorageAdapter`, `AsyncStorageAdapter`, `FileStorageAdapter`, `MemoryStorageAdapter` | [`packages/web/localStorageAdapter.js`](packages/web/localStorageAdapter.js), [`packages/mobile/asyncStorageAdapter.js`](packages/mobile/asyncStorageAdapter.js), [`packages/desktop/fileStorageAdapter.js`](packages/desktop/fileStorageAdapter.js), [`packages/core/storageAdapter.js`](packages/core/storageAdapter.js) |
| 4. Сервер і API | Node.js, Express (REST), Apollo Server (GraphQL), JWT | окремі проєкти ЛР 2–3 (поза цим репозиторієм) |
| 5. База даних | MongoDB Atlas, Mongoose | окремі проєкти ЛР 2–3 (поза цим репозиторієм) |

Також у межах курсу створено React SPA (React Hooks, Vite, Tailwind CSS — ЛР 4) — окремий проєкт.

### Що я вмію після курсу

- будувати REST (Express) і GraphQL (Apollo Server) API з автентифікацією JWT та базою MongoDB;
- створювати SPA на React з Hooks, мобільні застосунки на React Native і десктопні на Electron;
- виділяти платформонезалежну логіку в спільне ядро й підключати її через адаптери (dependency injection);
- організовувати monorepo на npm workspaces та покривати ядро й адаптери автоматичними тестами (60 тестів);
- налаштовувати безпечну взаємодію процесів в Electron (`contextIsolation`, `preload.cjs`, CSP).

### Історія проєкту

| | |
| --- | --- |
| **Назва проєкту** | ФармаОнлайн — інтернет-аптека (веб, мобільний і десктопний клієнти) |
| **Проблема** | Покупцю потрібен зручний каталог препаратів і оформлення замовлення на будь-якому пристрої; розробнику — підтримувати одні й ті самі правила на всіх платформах без дублювання коду |
| **Моя роль і внесок** | Єдиний розробник: серверна частина (REST, GraphQL, MongoDB), клієнти (веб, React SPA, React Native, Electron), спільне ядро й тести |
| **Обраний стек** | JavaScript на всіх рівнях: одна мова дозволяє винести логіку в спільний пакет; Express і Apollo — простий і поширений Node.js-стек; MongoDB зручна для документів «препарат» і «замовлення»; Electron і React Native дають десктопний та мобільний клієнти без нової мови |
| **Найскладніший кросплатформний виклик** | Одна логіка має працювати в браузері, Node.js і Electron, а дані — зберігатися по-різному (localStorage, файл). Розв’язання: пакет `@farmaonline/core` без платформних API та патерн «адаптер сховища» — клієнти містять лише інтерфейс і свій адаптер. Окремі труднощі: ES-модулі в браузері (import map) та Electron (`preload.cjs`, відсутній `__dirname`) |
| **Здобуті знання та вміння** | Проєктування архітектури кросплатформного застосунку, спільний код у monorepo, API на REST і GraphQL, тестування без зовнішніх бібліотек, безпека Electron |

## Посилання

GitHub: <https://github.com/YOUR-LOGIN/farmaonline-monorepo>
