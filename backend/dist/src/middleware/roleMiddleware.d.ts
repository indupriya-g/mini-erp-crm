import { Request, Response, NextFunction } from "express";
export declare function requireRole(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=roleMiddleware.d.ts.map