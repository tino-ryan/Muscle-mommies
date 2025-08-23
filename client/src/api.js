// src/api.js (assuming this is correctly set up as provided)
// Automatically pick the right backend URL
export const API_URL =
  process.env.NODE_ENV === 'development'
    ? '' // empty string → use proxy in dev
    : 'https://muscle-mommies-server.onrender.com';
