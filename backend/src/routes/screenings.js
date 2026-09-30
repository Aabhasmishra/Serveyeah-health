// Screening routes
import { Router } from 'express';
import * as screeningController from '../controllers/screeningController.js';

const router = Router();

router.post('/', screeningController.createScreening);
router.get('/', screeningController.getAllScreenings);

// Old Entry lookup by mobile number. Registered before the generic /:id route so
// it can never be shadowed by it. Read-only: it never creates a person.
router.get('/person/mobile/:mobileNumber', screeningController.getPersonByMobile);

router.get('/:id', screeningController.getScreeningById);
router.patch('/:id', screeningController.updateScreening);
router.patch('/:id/deactivate', screeningController.deactivateScreening);

// Additional routes for filtering by person, camp, worker
// (the /user/:userId route is legacy - it filters on the retired user_id column)
router.get('/person/:personId', screeningController.getScreeningsByPersonId);
router.get('/user/:userId', screeningController.getScreeningsByUserId);
router.get('/camp/:campId', screeningController.getScreeningsByCampId);
router.get('/worker/:workerId', screeningController.getScreeningsByWorkerId);

export default router;
