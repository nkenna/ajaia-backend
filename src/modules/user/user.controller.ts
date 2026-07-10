import { Request, Response, NextFunction } from "express";
import userService from "./user.service";

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

function getUserId(req: AuthenticatedRequest): string | undefined {
    return req.user?.id;
}

function unauthorized(res: Response): void {
    res.status(401).json({ error: "Unauthorized" });
}

class UserController {
    async updateUserInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const user = await userService.updateUserInfo({
                userId,
                firstName: req.body.firstName as string | undefined,
                lastName: req.body.lastName as string | undefined,
            });

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const result = await userService.changePassword({
                userId,
                currentPassword: req.body.currentPassword as string,
                newPassword: req.body.newPassword as string,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getUserInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const user = await userService.getUserInfo({ userId });

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const result = await userService.deleteAccount({
                userId,
                password: req.body.password as string,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
