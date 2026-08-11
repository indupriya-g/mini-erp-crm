"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;
        // Check if header exists
        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        // Expected format:
        // Authorization: Bearer TOKEN
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                message: "Invalid authorization format",
            });
        }
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authentication token required" });
        }
        // Verify the JWT
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Attach decoded user information to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        // Continue to the actual route
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
//# sourceMappingURL=authMiddleware.js.map