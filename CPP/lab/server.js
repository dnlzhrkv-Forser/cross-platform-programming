import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./services/db.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Логування кожного запиту: метод і адреса
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Фронтенд (папка public) віддається самим сервером
app.use(express.static("public"));

// Тестовий маршрут API
app.get("/api", (req, res) => {
  res.send("ФармаЛайф API працює");
});

// Маршрути препаратів
// Стан сервера й бази (використовується індикатором на сайті)
app.get("/api/health", (req, res) => {
  res.json({ server: "ok", db: mongoose.connection.readyState === 1 });
});

// Якщо БД не підключена — одразу зрозуміла помилка замість довгого очікування
const needDB = (req, res, next) =>
  mongoose.connection.readyState === 1
    ? next()
    : res.status(503).json({
        message:
          "Немає підключення до MongoDB Atlas. Перевірте MONGO_URI у .env та Network Access в Atlas",
      });

app.use("/api/medicines", needDB, medicineRoutes);
app.use("/api/orders", needDB, orderRoutes);

connectDB(process.env.MONGO_URI);

app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});
