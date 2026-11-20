import mongoose from "mongoose";

// Підключення до MongoDB Atlas. Сервер не падає, якщо БД недоступна —
// /api/health і відповіді 503 покажуть причину на сайті.
export async function connectDB(uri) {
  if (!uri) {
    console.error("У файлі .env немає MONGO_URI");
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("Підключено до MongoDB");
    return true;
  } catch (err) {
    console.error("Помилка підключення до MongoDB:", err.message);
    console.error("Перевірте логін/пароль у MONGO_URI та Network Access (IP-адреса) в Atlas");
    return false;
  }
}

export const isDbReady = () => mongoose.connection.readyState === 1;
