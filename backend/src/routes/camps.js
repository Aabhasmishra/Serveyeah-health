// Camp routes
import { Router } from 'express';
import * as campController from '../controllers/campController.js';

const router = Router();

router.post('/', campController.createCamp);
router.get('/', campController.getAllCamps);
router.get('/:id', campController.getCampById);
router.patch('/:id', campController.updateCamp);
router.patch('/:id/deactivate', campController.deactivateCamp);

export default router;