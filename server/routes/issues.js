const express = require('express');
const { body } = require('express-validator');
const {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
} = require('../controllers/issueController');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// VALIDATION RULES
// These are reusable arrays of checks that run before a controller
// function is called. If any check fails, the controller reads the
// errors with validationResult(req) and returns a 400 response.
//
// .trim()              → strip surrounding whitespace
// .notEmpty()          → value must not be an empty string
// .isLength()          → enforce min/max character counts
// .isIn([...])         → value must be one of the listed options
// .optional()          → skip this check if the field is absent
// ─────────────────────────────────────────────────────────────

// Rules for creating a new issue (title is required)
const createValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('type')
    .optional()
    .isIn(['bug', 'vulnerability', 'enhancement'])
    .withMessage('Type must be bug, vulnerability, or enhancement'),

  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be low, medium, high, or critical'),

  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'resolved', 'closed'])
    .withMessage('Status must be open, in-progress, resolved, or closed'),
];

// Rules for updating an issue (all fields optional — send only what changes)
const updateValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('type')
    .optional()
    .isIn(['bug', 'vulnerability', 'enhancement'])
    .withMessage('Type must be bug, vulnerability, or enhancement'),

  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be low, medium, high, or critical'),

  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'resolved', 'closed'])
    .withMessage('Status must be open, in-progress, resolved, or closed'),
];

// ─────────────────────────────────────────────────────────────
// ROUTES
// router.get / .post / .put / .delete map HTTP methods + paths
// to their controller functions. The validation array runs first,
// then the controller function.
//
// :id in the path means "anything here becomes req.params.id"
// ─────────────────────────────────────────────────────────────

router.get('/', getIssues);                              // GET    /api/issues
router.get('/:id', getIssueById);                        // GET    /api/issues/:id
router.post('/', createValidation, createIssue);         // POST   /api/issues
router.put('/:id', updateValidation, updateIssue);       // PUT    /api/issues/:id
router.delete('/:id', deleteIssue);                      // DELETE /api/issues/:id

module.exports = router;
