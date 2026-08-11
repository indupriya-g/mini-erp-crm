import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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
   const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET!
) as unknown as {
  userId: number;
  role: string;
};

    // Attach decoded user information to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // Continue to the actual route
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}