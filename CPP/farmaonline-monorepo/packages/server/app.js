import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(serverDir, "../web/public");
// Тека пакета ядра знаходиться за іменем пакета (символьне посилання workspaces)
const coreDir = path.dirname(fileURLToPath(import.meta.resolve("@farmaonline/core")));

const STATUS = { validation: 400, not_found: 404 };

// Збирає застосунок Express. Сервіс і перевірка готовності БД передаються ззовні,
// тому той самий код працює і з MongoDB, і з пам'яттю (у тестах).
export function createApp({ service, isDbReady = () => true }) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) console.log(`${req.method} ${req.originalUrl}`);
    next();
  });

  // Ядро віддається браузеру як є: лише .js-файли самого пакета (без тестів і package.json)
  app.get("/core/:file", (req, res) => {
    if (!/^[\w-]+\.js$/.test(req.params.file)) return res.sendStatus(404);
    res.sendFile(path.join(coreDir, req.params.file), (err) => err && !res.headersSent && res.sendStatus(404));
  });

  // Веб-клієнт
  app.use(express.static(webDir));

  const sendResult = (res, result, okStatus = 200) => {
    if (result.ok) return res.status(okStatus).json(result.medicine ?? result.order ?? { message: "ok" });
    return res.status(STATUS[result.code] ?? 400).json({ message: result.error });
  };
  const wrap = (handler) => async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  app.get("/api", (req, res) => res.send("ФармаОнлайн API працює"));

  // Стан сервера й бази (індикатор у шапці сайту)
  app.get("/api/health", (req, res) => res.json({ server: "ok", db: Boolean(isDbReady()) }));

  // Якщо БД не підключена — одразу зрозуміла помилка замість довгого очікування
  const needDB = (req, res, next) =>
    isDbReady()
      ? next()
      : res.status(503).json({
          message: "Немає підключення до MongoDB Atlas. Перевірте MONGO_URI у .env та Network Access в Atlas",
        });

  app.get("/api/medicines", needDB, wrap(async (req, res) => res.json(await service.listMedicines())));
  app.get("/api/medicines/:id", needDB, wrap(async (req, res) => sendResult(res, await service.getMedicine(req.params.id))));
  app.post("/api/medicines", needDB, wrap(async (req, res) => sendResult(res, await service.addMedicine(req.body), 201)));
  app.put("/api/medicines/:id", needDB, wrap(async (req, res) => sendResult(res, await service.updateMedicine(req.params.id, req.body))));
  app.delete("/api/medicines/:id", needDB, wrap(async (req, res) => {
    const result = await service.removeMedicine(req.params.id);
    return result.ok ? res.json({ message: "Препарат успішно видалено" }) : sendResult(res, result);
  }));

  app.get("/api/orders", needDB, wrap(async (req, res) => res.json(await service.listOrders())));
  app.post("/api/orders", needDB, wrap(async (req, res) => sendResult(res, await service.createOrder(req.body), 201)));

  app.use("/api", (req, res) => res.status(404).json({ message: "Маршрут не знайдено" }));
  return app;
}
