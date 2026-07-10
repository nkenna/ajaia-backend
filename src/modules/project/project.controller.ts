import { Request, Response, NextFunction } from "express";
import projectService from "./project.service";

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

function getUserId(req: AuthenticatedRequest): string | undefined {
    return req.user?.id ?? (req.params.userId as string | undefined);
}

class ProjectController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const project = await projectService.createProject({
                userId,
                name: req.body.name as string,
                description: req.body.description as string | undefined,
            });

            res.status(201).json(project);
        } catch (error) {
            next(error);
        }
    }

    async edit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const project = await projectService.editProject({
                id: req.params.id as string,
                userId,
                name: req.body.name as string,
                slug: req.body.slug as string,
                description: req.body.description as string | undefined,
            });

            res.status(200).json(project);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            await projectService.deleteProject({
                id: req.params.id as string,
                userId,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const projects = await projectService.listProjects({ userId });

            res.status(200).json(projects);
        } catch (error) {
            next(error);
        }
    }
}

export default new ProjectController();
