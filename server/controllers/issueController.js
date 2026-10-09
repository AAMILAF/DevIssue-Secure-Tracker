const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Issue = require('../models/Issue');

// ─────────────────────────────────────────────────────────────
// HELPER: isValidObjectId
// MongoDB identifies every document with a unique 24-character
// string called an ObjectId, e.g. "64a1f3b2c9e77b001234abcd".
// If a caller passes a random string like "abc" as an ID, Mongoose
// would throw a confusing cast error. This helper lets us catch
// that case early and return a clean 400 response instead.
// ─────────────────────────────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────
// GET /api/issues
// Returns all issues. Supports:
//   - ?search=   keyword search across title and description
//   - ?type=     filter by type  (bug | vulnerability | enhancement)
//   - ?severity= filter by severity (low | medium | high | critical)
//   - ?status=   filter by status (open | in-progress | resolved | closed)
//   - ?sort=     sort field, e.g. createdAt or severity (default: -createdAt)
// ─────────────────────────────────────────────────────────────
const getIssues = async (req, res, next) => {
  try {
    const { search, type, severity, status, sort } = req.query;

    // Build the filter object incrementally.
    // Only add a condition when the caller actually supplied that query param.
    const filter = {};

    // $regex lets MongoDB do a partial, case-insensitive text search.
    // $or means: match if EITHER title OR description contains the keyword.
    if (search) {
      // Escape all regex metacharacters in the user-supplied string before
      // passing it to MongoDB $regex.
      //
      // WHY THIS MATTERS (ReDoS):
      // If a user sends ?search=(((.+)+)+) MongoDB treats it as a real regex
      // and can spend seconds backtracking on it — effectively freezing the
      // server. This is called a ReDoS (Regular Expression Denial of Service).
      //
      // HOW THE FIX WORKS:
      // The replace() call puts a backslash in front of every character that
      // has special meaning in a regex: . * + ? ^ $ { } [ ] | ( ) \
      // After escaping, MongoDB treats the string as a plain literal —
      // searching for "(login)" finds the literal text "(login)", not a
      // capturing group. Case-insensitive matching is preserved via $options:'i'.
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    // Exact-match filters — only applied when the query param is present
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    // Default sort: newest first (-createdAt).
    // The caller can override with ?sort=severity, ?sort=-title, etc.
    // A leading "-" means descending order in Mongoose.
    //
    // SECURITY — sort injection:
    // Passing the raw `sort` string directly to Mongoose lets an attacker
    // supply values like "$where" or "{}.__proto__" that can alter query
    // behaviour. We prevent this with an allowlist: only the field names
    // this application actually needs are permitted. Anything else — or an
    // absent param — falls back silently to the safe default "-createdAt".
    //
    // Permitted sort fields (matches the Issue schema fields worth ordering by):
    const ALLOWED_SORT_FIELDS = new Set([
      'createdAt', '-createdAt',
      'updatedAt', '-updatedAt',
      'title',     '-title',
      'severity',  '-severity',
      'status',    '-status',
      'type',      '-type',
    ]);

    const sortOption = (sort && ALLOWED_SORT_FIELDS.has(sort)) ? sort : '-createdAt';

    const issues = await Issue.find(filter).sort(sortOption);

    res.status(200).json({
      count: issues.length,
      issues,
    });
  } catch (err) {
    next(err); // Pass the error to the global error handler in server.js
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/issues/:id
// Returns one issue by its MongoDB ObjectId.
// ─────────────────────────────────────────────────────────────
const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid issue ID format' });
    }

    const issue = await Issue.findById(id);

    // findById returns null when no document matches — not an error in
    // itself, but we treat it as a 404 (Not Found) for the caller.
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json(issue);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/issues
// Creates a new issue from the JSON body.
// express-validator checks the body before this function runs.
// ─────────────────────────────────────────────────────────────
const createIssue = async (req, res, next) => {
  try {
    // validationResult collects any errors flagged by the validators
    // defined in the route file. If there are errors, we stop here
    // and return them all at once so the caller knows exactly what
    // needs to be fixed.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, type, severity, status } = req.body;

    const issue = await Issue.create({
      title,
      description,
      type,
      severity,
      status,
    });

    // 201 Created is the correct status code for a successful creation
    res.status(201).json(issue);
  } catch (err) {
    // Mongoose schema-level validation errors have a specific name.
    // We surface the messages directly so they're easy to understand.
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/issues/:id
// Replaces the editable fields of an existing issue.
// Only the fields the caller sends will be updated.
// ─────────────────────────────────────────────────────────────
const updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid issue ID format' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Build the update object from only the fields the caller actually sent.
    //
    // WHY THIS MATTERS (partial-update bug):
    // If we destructure all five fields unconditionally and then pass them
    // straight to findByIdAndUpdate, any field the caller did NOT send will
    // be `undefined` in the object. Mongoose then writes that `undefined`
    // to MongoDB, silently erasing whatever was stored before.
    //
    // Example of the bug:
    //   Existing issue: { title: "Login crash", description: "Steps: ..." }
    //   Request body:   { status: "resolved" }
    //   Old code sends: { title: undefined, description: undefined,
    //                     type: undefined, severity: undefined,
    //                     status: "resolved" }
    //   MongoDB result: description is erased.
    //
    // The fix: only include a key in `updates` when req.body actually
    // contains that key. `key in req.body` is true even when the value is
    // an empty string, which is intentional — the caller explicitly sent it.
    const ALLOWED_FIELDS = ['title', 'description', 'type', 'severity', 'status'];
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    // returnDocument: 'after' → return the document AFTER the update.
    // This replaces the deprecated `new: true` option (deprecated in Mongoose 6+).
    // runValidators: true → run schema-level enum/length checks on changed fields.
    const updated = await Issue.findByIdAndUpdate(
      id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/issues/:id
// Permanently removes an issue from the database.
// ─────────────────────────────────────────────────────────────
const deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid issue ID format' });
    }

    const deleted = await Issue.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // 200 with a confirmation message — the client knows the delete succeeded
    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
};
