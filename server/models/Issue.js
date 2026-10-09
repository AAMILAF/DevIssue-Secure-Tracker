const mongoose = require('mongoose');

// A "schema" is a blueprint that tells MongoDB exactly what shape
// each Issue document must have. Think of it like a form template —
// every issue you create must fill in the fields defined here.
const issueSchema = new mongoose.Schema(
  {
    // -----------------------------------------------------------
    // TITLE
    // A short summary of the issue, e.g. "Login button crashes app"
    // - required: true   → you cannot create an issue without a title
    // - trim: true        → automatically removes leading/trailing spaces
    // - maxlength         → prevents extremely long titles
    // -----------------------------------------------------------
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    // -----------------------------------------------------------
    // DESCRIPTION
    // The full details of the issue — what happened, steps to
    // reproduce it, what was expected vs what actually occurred.
    // - Not required, because you might want to log a quick title
    //   first and fill in details later.
    // -----------------------------------------------------------
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // -----------------------------------------------------------
    // TYPE
    // Classifies what kind of issue this is.
    // - enum restricts the value to only these three options.
    //   Any other value will be rejected with a validation error.
    // - default: 'bug'  → if you don't specify a type, it defaults to bug
    // -----------------------------------------------------------
    type: {
      type: String,
      enum: {
        values: ['bug', 'vulnerability', 'enhancement'],
        message: 'Type must be bug, vulnerability, or enhancement',
      },
      default: 'bug',
    },

    // -----------------------------------------------------------
    // SEVERITY
    // How serious is this issue?
    //   low        → minor inconvenience, can wait
    //   medium     → noticeable problem, should be fixed soon
    //   high       → significant impact, needs prompt attention
    //   critical   → system breaking or security risk, fix immediately
    // -----------------------------------------------------------
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Severity must be low, medium, high, or critical',
      },
      default: 'medium',
    },

    // -----------------------------------------------------------
    // STATUS
    // Tracks the lifecycle of an issue through your workflow.
    //   open        → just reported, not yet being worked on
    //   in-progress → someone is actively working on it
    //   resolved    → the fix has been applied
    //   closed      → confirmed fixed and no further action needed
    // -----------------------------------------------------------
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'resolved', 'closed'],
        message: 'Status must be open, in-progress, resolved, or closed',
      },
      default: 'open',
    },
  },

  // -----------------------------------------------------------
  // SCHEMA OPTIONS
  // timestamps: true tells Mongoose to automatically add two fields:
  //   createdAt  → set once when the document is first created
  //   updatedAt  → updated automatically every time you save changes
  // You never have to set these yourself — Mongoose handles them.
  // -----------------------------------------------------------
  {
    timestamps: true,
  }
);

// Export the model so other files can import and use it.
// 'Issue' becomes the collection name in MongoDB (stored as 'issues').
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
