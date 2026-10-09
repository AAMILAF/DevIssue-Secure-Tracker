import axios from 'axios';

// Base URL for all issue requests.
// Because vite.config.js proxies /api → http://localhost:5000,
// we don't need to hardcode the backend port here.
const BASE = '/api/issues';

// Fetch all issues. Accepts an optional params object for
// search and filters, e.g. { search: 'safari', severity: 'high' }
export const getIssues = (params = {}) =>
  axios.get(BASE, { params }).then((res) => res.data);

// Fetch a single issue by its MongoDB _id
export const getIssueById = (id) =>
  axios.get(`${BASE}/${id}`).then((res) => res.data);

// Create a new issue. data is a plain JS object with the field values.
export const createIssue = (data) =>
  axios.post(BASE, data).then((res) => res.data);

// Update an existing issue. Only sends the fields you pass in data.
export const updateIssue = (id, data) =>
  axios.put(`${BASE}/${id}`, data).then((res) => res.data);

// Delete an issue by ID
export const deleteIssue = (id) =>
  axios.delete(`${BASE}/${id}`).then((res) => res.data);
