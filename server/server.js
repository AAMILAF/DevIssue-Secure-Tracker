// Load environment variables from .env file
// This must be the very first thing that runs
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS ----------
// Build the list of origins that are allowed to make cross-origin requests.
//
// WHY THIS MATTERS:
// cors() with no arguments sends Access-Control-Allow-Origin: * — every
// website on the internet can make authenticated requests to this API from
// a visitor's browser. Restricting to known origins closes that exposure.
//
// HOW IT WORKS:
// Browsers attach an Origin header to every cross-origin request.
// The cors middleware compares it against ALLOWED_ORIGINS:
//   - Match found  → response includes Access-Control-Allow-Origin: <origin>
//                    and the browser allows the page to read the response
//   - No match     → no ACAO header → browser blocks the page from reading it
//   - No Origin header (curl, Postman, server-to-server, Vite proxy)
//                  → allowed through unchanged — CORS only applies in browsers
//
// To support a deployed frontend, set CLIENT_ORIGIN in the server's
// environment, e.g. CLIENT_ORIGIN=https://devissue.example.com
// Do not commit that value; add it to the hosting platform's env config.
const ALLOWED_ORIGINS = ['http://localhost:5173'];
if (process.env.CLIENT_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_ORIGIN);
}

app.use(
  cors({
    origin(requestOrigin, callback) {
      // requestOrigin is undefined when there is no Origin header
      // (direct API calls from curl, Postman, or the Vite proxy).
      // We let those through because CORS restrictions only protect browsers.
      if (!requestOrigin || ALLOWED_ORIGINS.includes(requestOrigin)) {
        callback(null, true);
      } else {
        // Pass false (not an Error) so cors silently omits the
        // Access-Control-Allow-Origin header and calls next() without error.
        // The route handler still runs and returns its normal response —
        // but the browser will block JavaScript on the requesting page from
        // reading it, because the ACAO header is absent.
        // Passing an Error here instead causes next(err) → HTTP 500, which
        // is unnecessary noise: an unrecognised origin is not a server fault.
        callback(null, false);
      }
    },
  })
);

// ---------- Body parsing ----------
// Without this, req.body would be undefined
//
// limit: '10kb' — reject any request body larger than 10 kilobytes.
// Without this limit, a client can send a multi-megabyte JSON payload and
// the server will parse all of it, wasting memory and CPU.
// When a body exceeds the limit, Express automatically responds with
// HTTP 413 (Payload Too Large) before the request reaches any route handler.
app.use(express.json({ limit: '10kb' }));

// ---------- Database Connection ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Stop the server if DB connection fails
  });

// ---------- Health Check Route ----------
// A simple route to confirm the server is running
// Visit http://localhost:5000/api/health in your browser to test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DevIssue server is running' });
});

// ---------- Issue Routes ----------
// All routes defined in routes/issues.js are mounted under /api/issues.
// So router.get('/') becomes GET /api/issues,
//    router.get('/:id') becomes GET /api/issues/:id, and so on.
const issueRoutes = require('./routes/issues');
app.use('/api/issues', issueRoutes);

// ---------- Global Error Handler ----------
// This catches any unhandled errors thrown in route handlers
// The 4-parameter signature (err, req, res, next) is how Express
// recognises this as an error-handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
