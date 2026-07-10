import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/token.service";

export interface AuthUser {
    id: string;
    sessionId: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const token = header.slice("Bearer ".length).trim();
        const { userId, sessionId } = await verifyAccessToken(token);

        (req as AuthenticatedRequest).user = { id: userId, sessionId };
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
}
