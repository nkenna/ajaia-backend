import { Document, VersionHistory, File } from "../../lib/prisma";

export interface CreateDocumentInputData {
    userId: string;
    projectId: string;
    name: string;
    content?: unknown;
    contentHtml?: string;
}

export interface GetDocumentInputData {
    userId: string;
    documentId?: string;
    slug?: string;
    shareToken?: string;
}

export interface RenameDocumentInputData {
    id: string;
    userId: string;
    name: string;
    slug: string;
}

export interface UpdateDocumentContentInputData {
    id: string;
    userId: string;
    content: unknown;
    contentHtml?: string;
}

export interface ListVersionsInputData {
    documentId: string;
    userId: string;
}

export interface RestoreVersionInputData {
    documentId: string;
    userId: string;
    versionNumber: number;
}

export interface DeleteDocumentInputData {
    id: string;
    userId: string;
}

export interface ListDocumentsInputData {
    userId: string;
    projectId?: string;
}

export interface ImportFileAsDocumentInputData {
    userId: string;
    projectId?: string;
    name: string;
    content: unknown;
    contentHtml?: string;
    fileId: string;
}

export interface ImportFileIntoDocumentInputData {
    documentId: string;
    userId: string;
    content: unknown;
    contentHtml?: string;
    fileId: string;
}

export interface AttachFileInputData {
    documentId: string;
    userId: string;
    fileId: string;
}
