const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS Configuration ----------
const ALLOWED_ORIGINS = ['http://localhost:5173'];

if (process.env.CLIENT_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_ORIGIN);
}

app.use(
  cors({
    origin(requestOrigin, callback) {
      // Allow requests without an Origin header, such as local health checks.
      if (!requestOrigin || ALLOWED_ORIGINS.includes(requestOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  })
);

// ---------- Middleware ----------
app.use(express.json({ limit: '10kb' }));

// ---------- MongoDB Connection ----------
if (!process.env.MONGO_URI) {
  console.error('MongoDB connection failed: MONGO_URI is missing.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.name);
    console.error('Message:', err.message);

    if (err.reason?.servers) {
      for (const [address, server] of err.reason.servers) {
        console.error(`Server: ${address}`);
        console.error(
          'Connection error:',
          server.error?.message ?? 'No specific error available'
        );
      }
    }

    process.exit(1);
  });

// ---------- Health Check Route ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DevIssue server is running',
  });
});

// ---------- API Routes ----------
app.use('/api/issues', require('./routes/issues'));

// ---------- 404 Handler ----------
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// ---------- Global Error Handler ----------
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'request entity too large',
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON body',
    });
  }

  res.status(err.status || 500).json({
    error: err.status && err.status < 500
      ? err.message
      : 'Internal server error',
  });
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
