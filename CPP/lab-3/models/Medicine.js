import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    prescriptionRequired: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
    // id користувача, який створив препарат через GraphQL API (ЛР №3); для REST/seed — null
    owner: { type: String, default: null },
  },
  { timestamps: true }
);

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
