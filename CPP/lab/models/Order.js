import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: String,
        price: Number,
        qty: { type: Number, min: 1 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
