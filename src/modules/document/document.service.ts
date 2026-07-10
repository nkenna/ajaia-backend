import { prisma, Prisma } from "../../lib/prisma";
import { Document, VersionHistory, File } from "../../generated/prisma";
import {
    CreateDocumentInputData,
    GetDocumentInputData,
    RenameDocumentInputData,
    UpdateDocumentContentInputData,
    ListVersionsInputData,
    RestoreVersionInputData,
    DeleteDocumentInputData,
    ListDocumentsInputData,
    ImportFileAsDocumentInputData,
    ImportFileIntoDocumentInputData,
    AttachFileInputData,
} from "./document.types";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertValidSlug(slug: string): void {
    if (!SLUG_REGEX.test(slug)) {
        throw new Error(
            "Slug must be lowercase alphanumeric and hyphen-separated (e.g. 'my-document')"
        );
    }
}

function slugify(name: string): string {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "untitled";
}

class DocumentService {
    async createDocument(inputData: CreateDocumentInputData): Promise<Document> {
        assertValidSlug(inputData.slug);

        const project = await prisma.project.findUnique({
            where: { id: inputData.projectId },
            select: { userId: true },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.userId !== inputData.userId) {
            throw new Error("You do not have permission to create a document in this project");
        }

        const existing = await prisma.document.findFirst({
            where: { slug: inputData.slug, projectId: inputData.projectId },
            select: { id: true },
        });

        if (existing) {
            throw new Error("A document with this slug already exists in this project");
        }

        const content = inputData.content ?? { type: "doc", content: [] };

        return prisma.$transaction(
            async (tx) => {
                const document = await tx.document.create({
                    data: {
                        userId: inputData.userId,
                        projectId: inputData.projectId,
                        name: inputData.name,
                        slug: inputData.slug,
                        content,
                        contentHtml: inputData.contentHtml,
                    },
                });

                await tx.versionHistory.create({
                    data: {
                        documentId: document.id,
                        versionNumber: 1,
                        content,
                        contentHtml: inputData.contentHtml,
                    },
                });

                return document;
            },
            { timeout: 10000 }
        );
    }

    async getDocumentByShareToken(inputData: GetDocumentInputData): Promise<Document> {
        if (!inputData.shareToken) {
            throw new Error("Share token is required");
        }

        const document = await prisma.document.findUnique({
            where: { shareToken: inputData.shareToken },
            include: {
                versions: { orderBy: { versionNumber: "desc" } },
            },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        return document;
    }

    async getOwnedDocument(inputData: GetDocumentInputData): Promise<Document> {
        const where = inputData.documentId
            ? { id: inputData.documentId }
            : inputData.slug
            ? { slug: inputData.slug }
            : null;

        if (!where) {
            throw new Error("Document id or slug is required");
        }

        const document = await prisma.document.findFirst({
            where,
            include: {
                versions: { orderBy: { versionNumber: "desc" } },
            },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        if (document.userId !== inputData.userId) {
            throw new Error("You do not have permission to access this document");
        }

        return document;
    }

    async renameDocument(inputData: RenameDocumentInputData): Promise<Document> {
        const existing = await prisma.document.findUnique({
            where: { id: inputData.id },
            select: { userId: true, projectId: true },
        });

        if (!existing) {
            throw new Error("Document not found");
        }

        if (existing.userId !== inputData.userId) {
            throw new Error("You do not have permission to rename this document");
        }

        assertValidSlug(inputData.slug);

        const conflicting = await prisma.document.findFirst({
            where: {
                slug: inputData.slug,
                projectId: existing.projectId,
                NOT: { id: inputData.id },
            },
            select: { id: true },
        });

        if (conflicting) {
            throw new Error("A document with this slug already exists in this project");
        }

        return prisma.document.update({
            where: { id: inputData.id },
            data: {
                name: inputData.name,
                slug: inputData.slug,
            },
        });
    }

    async updateDocumentContent(
        inputData: UpdateDocumentContentInputData
    ): Promise<Document> {
        const existing = await prisma.document.findUnique({
            where: { id: inputData.id },
            select: { userId: true, currentVersion: true },
        });

        if (!existing) {
            throw new Error("Document not found");
        }

        if (existing.userId !== inputData.userId) {
            throw new Error("You do not have permission to edit this document");
        }

        const nextVersion = existing.currentVersion + 1;

        return prisma.$transaction(
            async (tx) => {
                await tx.versionHistory.create({
                    data: {
                        documentId: inputData.id,
                        versionNumber: nextVersion,
                        content: inputData.content as Prisma.InputJsonValue,
                        contentHtml: inputData.contentHtml,
                    },
                });

                return tx.document.update({
                    where: { id: inputData.id },
                    data: {
                        content: inputData.content as Prisma.InputJsonValue,
                        contentHtml: inputData.contentHtml,
                        currentVersion: nextVersion,
                    },
                });
            },
            { timeout: 10000 }
        );
    }

    async listVersions(inputData: ListVersionsInputData): Promise<VersionHistory[]> {
        const document = await prisma.document.findUnique({
            where: { id: inputData.documentId },
            select: { userId: true },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        if (document.userId !== inputData.userId) {
            throw new Error("You do not have permission to view this document's versions");
        }

        return prisma.versionHistory.findMany({
            where: { documentId: inputData.documentId },
            orderBy: { versionNumber: "desc" },
        });
    }

    async restoreVersion(inputData: RestoreVersionInputData): Promise<Document> {
        const document = await prisma.document.findUnique({
            where: { id: inputData.documentId },
            select: { userId: true, currentVersion: true },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        if (document.userId !== inputData.userId) {
            throw new Error("You do not have permission to restore this document");
        }

        const version = await prisma.versionHistory.findUnique({
            where: {
                documentId_versionNumber: {
                    documentId: inputData.documentId,
                    versionNumber: inputData.versionNumber,
                },
            },
        });

        if (!version) {
            throw new Error("Version not found");
        }

        const nextVersion = document.currentVersion + 1;

        return prisma.$transaction(
            async (tx) => {
                await tx.versionHistory.create({
                    data: {
                        documentId: inputData.documentId,
                        versionNumber: nextVersion,
                        content: version.content as Prisma.InputJsonValue,
                        contentHtml: version.contentHtml,
                    },
                });

                return tx.document.update({
                    where: { id: inputData.documentId },
                    data: {
                        content: version.content as Prisma.InputJsonValue,
                        contentHtml: version.contentHtml,
                        currentVersion: nextVersion,
                    },
                });
            },
            { timeout: 10000 }
        );
    }

    async deleteDocument(inputData: DeleteDocumentInputData): Promise<void> {
        const existing = await prisma.document.findUnique({
            where: { id: inputData.id },
            select: { userId: true },
        });

        if (!existing) {
            throw new Error("Document not found");
        }

        if (existing.userId !== inputData.userId) {
            throw new Error("You do not have permission to delete this document");
        }

        await prisma.document.delete({
            where: { id: inputData.id },
        });
    }

    async listDocuments(inputData: ListDocumentsInputData): Promise<Document[]> {
        return prisma.document.findMany({
            where: {
                userId: inputData.userId,
                ...(inputData.projectId
                    ? { projectId: inputData.projectId }
                    : {}),
            },
            orderBy: { updatedAt: "desc" },
        });
    }

    async importFileAsDocument(
        inputData: ImportFileAsDocumentInputData
    ): Promise<Document> {
        let projectId = inputData.projectId;

        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { userId: true },
            });
            if (!project) {
                throw new Error("Project not found");
            }
            if (project.userId !== inputData.userId) {
                throw new Error("You do not have permission to use this project");
            }
        } else {
            const project = await prisma.project.findFirst({
                where: { userId: inputData.userId },
                orderBy: { createdAt: "asc" },
            });
            if (!project) {
                throw new Error("No project available to host the document");
            }
            projectId = project.id;
        }

        const slugBase = slugify(inputData.name);
        let slug = slugBase;
        let attempt = 0;
        while (
            await prisma.document.findFirst({
                where: { slug, projectId },
                select: { id: true },
            })
        ) {
            attempt += 1;
            slug = `${slugBase}-${attempt}`;
        }

        const content = inputData.content as Prisma.InputJsonValue;

        return prisma.$transaction(
            async (tx) => {
                const document = await tx.document.create({
                    data: {
                        userId: inputData.userId,
                        projectId,
                        name: inputData.name,
                        slug,
                        content,
                        contentHtml: inputData.contentHtml,
                    },
                });

                await tx.versionHistory.create({
                    data: {
                        documentId: document.id,
                        versionNumber: 1,
                        content,
                        contentHtml: inputData.contentHtml,
                    },
                });

                await tx.file.update({
                    where: { id: inputData.fileId },
                    data: { documentId: document.id },
                });

                return document;
            },
            { timeout: 10000 }
        );
    }

    async importFileIntoDocument(
        inputData: ImportFileIntoDocumentInputData
    ): Promise<Document> {
        const document = await prisma.document.findUnique({
            where: { id: inputData.documentId },
            select: { userId: true, currentVersion: true },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        if (document.userId !== inputData.userId) {
            throw new Error("You do not have permission to edit this document");
        }

        const nextVersion = document.currentVersion + 1;
        const content = inputData.content as Prisma.InputJsonValue;

        return prisma.$transaction(
            async (tx) => {
                await tx.versionHistory.create({
                    data: {
                        documentId: inputData.documentId,
                        versionNumber: nextVersion,
                        content,
                        contentHtml: inputData.contentHtml,
                    },
                });

                const updated = await tx.document.update({
                    where: { id: inputData.documentId },
                    data: {
                        content,
                        contentHtml: inputData.contentHtml,
                        currentVersion: nextVersion,
                    },
                });

                await tx.file.update({
                    where: { id: inputData.fileId },
                    data: { documentId: inputData.documentId },
                });

                return updated;
            },
            { timeout: 10000 }
        );
    }

    async attachFile(inputData: AttachFileInputData): Promise<File> {
        const document = await prisma.document.findUnique({
            where: { id: inputData.documentId },
            select: { userId: true },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        if (document.userId !== inputData.userId) {
            throw new Error("You do not have permission to attach files to this document");
        }

        const file = await prisma.file.findUnique({
            where: { id: inputData.fileId },
            select: { uploadedById: true },
        });

        if (!file) {
            throw new Error("File not found");
        }

        if (file.uploadedById !== inputData.userId) {
            throw new Error("You do not have permission to use this file");
        }

        return prisma.file.update({
            where: { id: inputData.fileId },
            data: { documentId: inputData.documentId },
        });
    }
}

export default new DocumentService();
