import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicineController.js';
import { validateMedicine } from '../middleware/validateMedicine.js';

const router = express.Router();

router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.post('/', validateMedicine, createMedicine);
router.put('/:id', validateMedicine, updateMedicine);
router.delete('/:id', deleteMedicine);

export default router;
