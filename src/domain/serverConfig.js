/**
 * Domain — server connection configuration.
 * VITE_API_URL задаётся при деплое (Vercel → Environment Variables).
 */

export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
