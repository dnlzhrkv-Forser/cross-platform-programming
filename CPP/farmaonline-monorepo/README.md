# ФармаОнлайн: монорепозиторій (ЛР 7-8)

Спільне ядро `@farmaonline/core` + сервер (Express + **MongoDB Atlas**) + веб-клієнт на 4 вкладки + десктопний клієнт (Electron).

```
packages/
  core/        спільне ядро: перевірка даних, логіка аптеки, інтерфейс репозиторію (без залежностей)
  server/      REST API; адаптер MongoDB підставляється в сервіс ядра; віддає сайт і ядро браузеру
  web/public/  сайт: Головна · Каталог · Кошик · Адмін (ES-модулі, імпортують те саме ядро)
  desktop/     Electron-клієнт (окремий список препаратів, ядро MedicinesService)
```

## Запуск

```bash
npm install                 # з кореня: залежності + посилання на ядро
cp .env.example .env        # і впишіть MONGO_URI вашого кластера Atlas
npm run seed                # (за бажанням) додати тестові препарати в порожню колекцію
npm run start:web           # сайт і API: http://localhost:3000
npm test                    # тести всіх пакетів
```

У MongoDB Atlas у **Network Access** має бути дозволена ваша IP-адреса. Сайт працює з базою `pharmalife`
(колекції `medicines` і `orders`) — дані з ЛР №2 підхоплюються автоматично. Індикатор у шапці сайту показує
стан сервера та підключення до бази.

## REST API

| Метод | Маршрут | Дія |
| --- | --- | --- |
| GET | `/api/health` | стан сервера й БД |
| GET / POST | `/api/medicines` | список / додати препарат |
| GET / PUT / DELETE | `/api/medicines/:id` | один препарат / змінити / видалити |
| GET / POST | `/api/orders` | список / оформити замовлення |

## Як це пов'язано з темою ЛР

`PharmacyService` у ядрі отримує репозиторій через конструктор (dependency injection) і не знає, де лежать дані:
у тестах це `MemoryPharmacyRepository`, у сервері — `MongoPharmacyRepository`. Перевірка форм (`validateCatalogItem`,
`validateCustomer`), фільтри каталогу та операції кошика виконуються тим самим кодом і в браузері, і на сервері.
Браузер імпортує ядро за іменем пакета через import map (`/core/index.js`).
