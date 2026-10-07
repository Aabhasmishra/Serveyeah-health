// Household survey routes
import { Router } from 'express';
import * as surveyController from '../controllers/surveyController.js';

const router = Router();

// Submit a household survey. Read-only in the sense that it never touches an
// existing person or screening: it stores one household response and returns the
// generated patient_id.
router.post('/', surveyController.createHouseholdSurvey);

// Aggregate counts for the app: total responses, responses in the last 7 days and
// distinct villages. Counts only, so it carries no PII and needs no auth.
//
// Registered before any future /:id route so a literal "stats" can never be
// swallowed as an id. Keep it above any parameterised route added later.
router.get('/stats/', surveyController.getHouseholdSurveyStats);

// Not implemented yet, and deliberately absent rather than stubbed:
//   GET /list/        PII-bearing rows - needs an auth decision this backend
//                     does not have (the Django equivalent relied on staff
//                     sessions, which do not exist here)
//   GET /export.csv   same reason

export default router;
