import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    prescriptionRequired: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
