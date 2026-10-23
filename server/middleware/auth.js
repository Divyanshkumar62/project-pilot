const jwt = require("jsonwebtoken");
const { requireRole, checkRole } = require("./role");

function auth(req, res, next) {
  let token;
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.header("x-auth-token")) {
    token = req.header("x-auth-token");
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

auth.auth = auth;
auth.requireRole = requireRole;
auth.checkRole = checkRole;

module.exports = auth;
