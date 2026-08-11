"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // authMiddleware should already have added the user
        // information to the request.
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource",
            });
        }
        next();
    };
}
//# sourceMappingURL=roleMiddleware.js.map