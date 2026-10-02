import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';

// Поля, які дозволено записувати з тіла запиту
const pickFields = (body) => {
  const { name, category, manufacturer, price, prescriptionRequired, description } = body;
  return { name, category, manufacturer, price, prescriptionRequired, description };
};

// GET /api/medicines
export async function getMedicines(req, res) {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/medicines/:id
export async function getMedicineById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некоректний id' });
    }
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Препарат не знайдено' });
    }
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/medicines
export async function createMedicine(req, res) {
  try {
    const medicine = await Medicine.create(pickFields(req.body));
    res.status(201).json(medicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// PUT /api/medicines/:id
export async function updateMedicine(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некоректний id' });
    }
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body),
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ message: 'Препарат не знайдено' });
    }
    res.json(medicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// DELETE /api/medicines/:id
export async function deleteMedicine(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некоректний id' });
    }
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Препарат не знайдено' });
    }
    res.json({ message: 'Препарат успішно видалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
