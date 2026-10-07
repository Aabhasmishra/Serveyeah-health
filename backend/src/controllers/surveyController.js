// Household survey controller
//
// Thin HTTP layer over surveyService. It owns no SQL and no validation rules:
// everything it forwards to the service, and then translates the service's errors
// into this project's AppError codes so the shared errorHandler produces the
// standard { success: false, error: { message, code, details } } shape.
//
// Only two endpoints are wired here. The PII-bearing list and the CSV export are
// deliberately not implemented yet; they need an auth decision this backend does
// not currently have (see the SETUP notes for the Django equivalent's
// IsStaffOrSurveyKey, which relies on Django staff sessions that do not exist
// here).

import * as surveyService from '../services/surveyService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Read a query parameter that may arrive more than once (?worker=a&worker=b).
 * Express turns a repeated parameter into an array; only the first is used so a
 * malformed query degrades to one real filter instead of an unmatchable string.
 */
function firstQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * POST /api/surveys/household/
 * Store one household survey and return the generated patient_id (PS000001...).
 */
export async function createHouseholdSurvey(req, res, next) {
  // A bot filling the hidden anti-bot field gets a success shape and no row, so
  // it never learns whether it succeeded and never consumes a patient ID. The
  // native app form does not send this field, so this is normally inert.
  if (surveyService.isHoneypotSubmission(req.body)) {
    return res.status(201).json({ success: true, data: { patient_id: '' } });
  }

  try {
    const survey = await surveyService.createHouseholdSurvey(req.body);
    return res.status(201).json({ success: true, data: survey });
  } catch (err) {
    // Validation failures arrive as one coded error carrying a details object
    // keyed by the survey field name, so the form can highlight each field.
    if (err.code === 'VALIDATION_ERROR') {
      return next(new AppError(err.message, 400, 'VALIDATION_ERROR', err.details));
    }
    if (err.message === 'Camp not found') {
      return next(new AppError(err.message, 404, 'CAMP_NOT_FOUND'));
    }
    if (err.message === 'Worker not found') {
      return next(new AppError(err.message, 404, 'WORKER_NOT_FOUND'));
    }
    next(err);
  }
}

/**
 * GET /api/surveys/household/stats/?worker=W0001&camp=C0001
 * Aggregate counts only - total responses, responses in the last 7 days, and
 * distinct villages. Carries no PII, so it is safe for the app to show.
 *
 * An unknown worker or camp id is not an error here: it simply matches no rows
 * and reports zeros. That matches the upstream behaviour and avoids turning a
 * stale link into a failure.
 */
export async function getHouseholdSurveyStats(req, res, next) {
  try {
    const stats = await surveyService.getHouseholdSurveyStats({
      worker: firstQueryValue(req.query.worker),
      camp: firstQueryValue(req.query.camp),
    });

    return res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
