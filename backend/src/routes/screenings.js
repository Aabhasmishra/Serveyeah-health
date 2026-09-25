// Screening routes
import { Router } from 'express';
import * as screeningController from '../controllers/screeningController.js';

const router = Router();

router.post('/', screeningController.createScreening);
router.get('/', screeningController.getAllScreenings);
router.get('/:id', screeningController.getScreeningById);
router.patch('/:id', screeningController.updateScreening);
router.patch('/:id/deactivate', screeningController.deactivateScreening);

// Additional routes for filtering by user, camp, worker
router.get('/user/:userId', screeningController.getScreeningsByUserId);
router.get('/camp/:campId', screeningController.getScreeningsByCampId);
router.get('/worker/:workerId', screeningController.getScreeningsByWorkerId);

export default router;