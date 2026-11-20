import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';

// GET /api/orders
export async function getOrders(req, res) {
  try {
    res.json(await Order.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/orders — ціни беруться з бази, а не з клієнта
export async function createOrder(req, res) {
  try {
    const { name, phone, address, items } = req.body;
    if (!name?.trim() || !phone?.trim() || !address?.trim() || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Вкажіть ім'я, телефон, адресу та додайте товари до кошика" });
    }
    const ids = items.map((i) => i.id).filter((id) => /^[a-f\d]{24}$/i.test(id));
    const meds = await Medicine.find({ _id: { $in: ids } });
    const lines = items
      .map((i) => {
        const m = meds.find((x) => x.id === i.id);
        return m && { medicine: m._id, name: m.name, price: m.price, qty: Math.max(1, parseInt(i.qty) || 1) };
      })
      .filter(Boolean);
    if (!lines.length) return res.status(400).json({ message: 'Товари з кошика не знайдено в базі' });
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    res.status(201).json(await Order.create({ name, phone, address, items: lines, total }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
