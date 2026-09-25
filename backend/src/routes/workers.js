// Worker routes
import { Router } from 'express';
import * as workerController from '../controllers/workerController.js';

const router = Router();

router.post('/', workerController.createWorker);
router.get('/', workerController.getAllWorkers);
router.get('/:id', workerController.getWorkerById);
router.patch('/:id', workerController.updateWorker);
router.patch('/:id/deactivate', workerController.deactivateWorker);

export default router;