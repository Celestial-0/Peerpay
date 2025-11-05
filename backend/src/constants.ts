const DB_NAME =
  process.env.NODE_ENV === 'production' ? 'peerpay' : 'peerpay-dev';

// JWT Configuration
// IMPORTANT: Override these in production with environment variables
const JWT_SECRET =
  process.env.JWT_SECRET ||
  'a8f5e2c9d3b7e1f4a6c8d2e9b4f7a3c5e8d1b6f9a2c7e4d8b3f6a9c2e5d7b4f1a8';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'c3e9f2a5d8b1e4c7f9a2d6b3e8c1f5a9d2b7e4c8f1a6d9b2e5c7f3a8d1b6e9c4f2';
const JWT_REFRESH_EXPIRES_IN: string | number =
  process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const IS_PUBLIC_KEY = process.env.IS_PUBLIC_KEY || 'isPublic';
export {
  DB_NAME,
  IS_PUBLIC_KEY,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
};
