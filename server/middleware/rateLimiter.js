const rateLimit = require("express-rate-limit");

// General API Rate Limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

// Strict Auth Limiter: 20 requests per 15 minutes per IP (guards against brute-force login/signup)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP, please try again after 15 minutes",
  },
});

// Upload Limiter: 30 upload requests per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload rate limit reached, please try again later",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
};
