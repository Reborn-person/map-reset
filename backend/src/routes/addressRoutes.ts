import express from 'express';
import { getAddresses, getNearbyAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addressController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/nearby', protect, getNearbyAddresses);
router.route('/').get(protect, getAddresses).post(protect, createAddress);
router.route('/:id').put(protect, updateAddress).delete(protect, deleteAddress);

export default router;
