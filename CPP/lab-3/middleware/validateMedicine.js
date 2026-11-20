// Перевіряє наявність і коректність обов'язкових полів препарату
export function validateMedicine(req, res, next) {
  const { name, category, manufacturer, price } = req.body;

  const isEmpty = (v) => typeof v !== 'string' || v.trim() === '';

  if (isEmpty(name) || isEmpty(category) || isEmpty(manufacturer)) {
    return res.status(400).json({
      message: "Поля name, category та manufacturer обов'язкові й не можуть бути порожніми",
    });
  }

  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    return res.status(400).json({
      message: "Поле price обов'язкове і має бути невід'ємним числом",
    });
  }

  next();
}
