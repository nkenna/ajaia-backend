import { Request, Response, NextFunction } from "express";
import documentService from "./document.service";
import {
    ShareDocumentInputData,
    UnshareDocumentInputData,
    ListDocumentSharesInputData,
    ListSharedDocumentsInputData,
} from "./document.types";

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

function getUserId(req: AuthenticatedRequest): string | undefined {
    return req.user?.id;
}

function unauthorized(res: Response): void {
    res.status(401).json({ error: "Unauthorized" });
}

class DocumentController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.createDocument({
                userId,
                projectId: req.body.projectId as string,
                name: req.body.name as string,
                content: req.body.content,
                contentHtml: req.body.contentHtml as string | undefined,
            });

            res.status(201).json(document);
        } catch (error) {
            next(error);
        }
    }

    async getByShareToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const document = await documentService.getDocumentByShareToken({
                userId: getUserId(req) ?? "",
                shareToken: req.params.shareToken as string,
            });

            res.status(200).json(document);
        } catch (error) {
            next(error);
        }
    }

    async getOwned(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.getDocument({
                userId,
                documentId: req.params.id as string,
            });

            res.status(200).json(document);
        } catch (error) {
            next(error);
        }
    }

    async rename(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.renameDocument({
                id: req.params.id as string,
                userId,
                name: req.body.name as string,
                slug: req.body.slug as string,
            });

            res.status(200).json(document);
        } catch (error) {
            next(error);
        }
    }

    async updateContent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.updateDocumentContent({
                id: req.params.id as string,
                userId,
                content: req.body.content,
                contentHtml: req.body.contentHtml as string | undefined,
            });

            res.status(200).json(document);
        } catch (error) {
            next(error);
        }
    }

    async listVersions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const versions = await documentService.listVersions({
                documentId: req.params.id as string,
                userId,
            });

            res.status(200).json(versions);
        } catch (error) {
            next(error);
        }
    }

    async restoreVersion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.restoreVersion({
                documentId: req.params.id as string,
                userId,
                versionNumber: Number(req.body.versionNumber),
            });

            res.status(200).json(document);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            await documentService.deleteDocument({
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
                unauthorized(res);
                return;
            }

            const documents = await documentService.listDocuments({
                userId,
                projectId: req.query.projectId as string | undefined,
            });

            res.status(200).json(documents);
        } catch (error) {
            next(error);
        }
    }

    async importAsDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.importFileAsDocument({
                userId,
                projectId: req.body.projectId as string | undefined,
                name: req.body.name as string,
                content: req.body.content,
                contentHtml: req.body.contentHtml as string | undefined,
                fileId: req.body.fileId as string,
            });

            res.status(201).json(document);
        } catch (error) {
            next(error);
        }
    }

    async importIntoDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const document = await documentService.importFileIntoDocument({
                documentId: req.params.id as string,
                userId,
                content: req.body.content,
                contentHtml: req.body.contentHtml as string | undefined,
                fileId: req.body.fileId as string,
            });

            res.status(200).json(document);
        } catch (error) {
            next(error);
        }
    }

    async attachFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const file = await documentService.attachFile({
                documentId: req.params.id as string,
                userId,
                fileId: req.body.fileId as string,
            });

            res.status(200).json(file);
        } catch (error) {
            next(error);
        }
    }

    async share(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const share = await documentService.shareDocument({
                documentId: req.params.id as string,
                userId,
                sharedWithEmail: req.body.email as string,
                permission: req.body.permission as ShareDocumentInputData["permission"],
            });

            res.status(201).json(share);
        } catch (error) {
            next(error);
        }
    }

    async unshare(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            await documentService.unshareDocument({
                documentId: req.params.id as string,
                userId,
                shareId: req.params.shareId as string,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async listShares(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const shares = await documentService.listDocumentShares({
                documentId: req.params.id as string,
                userId,
            });

            res.status(200).json(shares);
        } catch (error) {
            next(error);
        }
    }

    async listSharedWithMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUserId(req);
            if (!userId) {
                unauthorized(res);
                return;
            }

            const documents = await documentService.listSharedDocuments({
                userId,
            });

            res.status(200).json(documents);
        } catch (error) {
            next(error);
        }
    }
}

export default new DocumentController();
