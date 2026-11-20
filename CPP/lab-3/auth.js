import jwt from 'jsonwebtoken';
import { users } from './data.js';

// У навчальному проєкті секрет зберігається в коді,
// у реальному — лише у змінних середовища
export const JWT_SECRET = 'pharmalife-lab3-secret-key';

// Створює JWT на основі id користувача, термін дії — 1 година
export function createToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
}

// Перевіряє токен і повертає користувача з масиву users або null
export function getUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return users.find((u) => u.id === payload.id) || null;
  } catch {
    return null; // токен неправильний або термін дії минув
  }
}

// Виділяє токен із заголовка "Authorization: Bearer <token>"
export function getUserFromAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return getUserFromToken(token);
}
