import express from 'express';
import multer from 'multer';
import { importAddressesCSV, exportAddressesCSV, exportAddressesGeoJSON } from '../controllers/batchController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', protect, upload.single('file'), importAddressesCSV);
router.get('/export', protect, exportAddressesCSV);
router.get('/export/geojson', protect, exportAddressesGeoJSON);

export default router;
