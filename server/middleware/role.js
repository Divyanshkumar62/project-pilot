function checkRole(allowedRoles = []) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        msg: "No user role found, Unauthorized!",
      });
    }

    // Convert both user role and allowed roles to lowercase for resilient comparison
    const userRole = String(req.user.role).toLowerCase();
    const allowedRolesLower = rolesArray.map((role) => String(role).toLowerCase());

    if (!allowedRolesLower.includes(userRole)) {
      return res.status(403).json({
        msg: "Access Denied. Insufficient permission!",
      });
    }

    next();
  };
}

function requireRole(role) {
  return checkRole([role]);
}

module.exports = checkRole;
module.exports.checkRole = checkRole;
module.exports.requireRole = requireRole;
