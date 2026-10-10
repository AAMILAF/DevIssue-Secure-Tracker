# DevIssue — Secure Developer Issue & Vulnerability Tracker

DevIssue is a web application for tracking software bugs, security vulnerabilities, and feature enhancements in one place. It provides a dashboard to manage issues, monitor their status, and organize work by severity and type.

## Features

- **Issue management:** Create, view, update, and delete issues.
- **Issue classification:** Categorize issues as bugs, vulnerabilities, or enhancements.
- **Severity tracking:** Assign Low, Medium, High, or Critical severity.
- **Status management:** Track issues as Open, In Progress, Resolved, or Closed.
- **Search and filtering:** Find issues using search and available filters.
- **Sorting:** Organize issues using supported fields.
- **Dashboard statistics:** View issue counts independently of the current search and filter results.
- **Input validation:** Validate issue data on the backend.
- **Safer API handling:** Restrict search patterns, allowlist sorting fields, limit JSON request sizes, and configure allowed CORS origins.

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

**Development Tools**
- Git and GitHub
- VS Code
- npm

## Project Structure

```text
DevIssue/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/AAMILAF/DevIssue-Secure-Tracker.git
cd DevIssue-Secure-Tracker
```

### 2. Configure and start the backend

From the project root, run:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Replace the placeholder with your own MongoDB connection string. Never commit your actual `.env` file or credentials.

Start the backend:

```bash
npm run dev
```

The backend health endpoint is:

`http://localhost:5000/api/health`

### 3. Configure and start the frontend

Open a second terminal from the project root and run:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

`http://localhost:5173`

Keep both the backend and frontend running while using the application.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server health |
| GET | `/api/issues` | List issues; supports search and filtering |
| GET | `/api/issues/:id` | Retrieve one issue |
| POST | `/api/issues` | Create an issue |
| PUT | `/api/issues/:id` | Update an issue |
| DELETE | `/api/issues/:id` | Delete an issue |

The API uses JSON for request and response data where applicable.

## Security Considerations

Security-oriented development practices implemented in this project include input validation, search-pattern escaping, allowlisted sorting, a JSON request-size limit, and restricted CORS origins.

**Scope note:** These protections do not replace authentication, authorization, rate limiting, or a full security audit. Do not deploy the application publicly with sensitive data until appropriate access controls and production configuration have been added and tested.

## Learning Objectives

This project provides practical experience with:

- Full-stack JavaScript development
- REST API design
- MongoDB data modelling
- Frontend-to-backend integration
- Input validation and error handling
- Git version control and GitHub workflows
- Security-conscious application development

## Future Improvements

- User authentication and role-based access control
- Audit logs and issue activity history
- Automated tests and continuous integration
- Pagination for large issue collections
- Security testing and production deployment

## License

See the [LICENSE](LICENSE) file for the project's license terms.
