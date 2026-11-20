import mongoose from "mongoose";

// Схеми збігаються з колекціями medicines та orders бази pharmalife (ЛР №2),
// тому раніше додані препарати й замовлення з'являться на сайті.
const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    prescriptionRequired: { type: Boolean, default: false },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
        name: String,
        price: Number,
        qty: { type: Number, min: 1 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Medicine = mongoose.models.Medicine ?? mongoose.model("Medicine", medicineSchema);
export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
