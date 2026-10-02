import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Medicine from './models/Medicine.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

if ((await Medicine.countDocuments()) > 0) {
  console.log('У колекції вже є препарати — seed пропущено');
} else {
  await Medicine.insertMany([
    { name: 'Парацетамол 500 мг', category: 'Жарознижувальні', manufacturer: 'Дарниця', price: 45.5, description: 'Таблетки, 10 шт.' },
    { name: 'Ібупрофен 200 мг', category: 'Знеболювальні', manufacturer: 'Київмедпрепарат', price: 62, description: 'Таблетки, 20 шт.' },
    { name: 'Цитрамон П', category: 'Знеболювальні', manufacturer: 'Фармак', price: 38, description: 'Таблетки, 10 шт.' },
    { name: 'Амоксицилін 500 мг', category: 'Антибіотики', manufacturer: 'Здоров’я', price: 118, prescriptionRequired: true, description: 'Капсули, 16 шт.' },
    { name: 'Вітамін C 1000 мг', category: 'Вітаміни', manufacturer: 'Solgar', price: 289, description: 'Таблетки, 60 шт.' },
    { name: 'Лоратадин 10 мг', category: 'Антиалергічні', manufacturer: 'Борщагівський ХФЗ', price: 54, description: 'Таблетки, 10 шт.' },
    { name: 'Омепразол 20 мг', category: 'Шлунково-кишкові', manufacturer: 'Фармак', price: 96, description: 'Капсули, 30 шт.' },
    { name: 'Нурофен сироп', category: 'Жарознижувальні', manufacturer: 'Reckitt', price: 135, description: 'Суспензія для дітей, 100 мл' },
  ]);
  console.log('Додано тестові препарати');
}
await mongoose.disconnect();
