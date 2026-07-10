import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import { prisma } from "../../lib/prisma";
import config from "../../config/config";

export const ALLOWED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
const UPLOAD_DIR = config.uploadDir;
const MAX_FILE_SIZE = config.maxFileSize;

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter(_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
            cb(
                new Error(
                    `Unsupported file type '${ext}'. Allowed types: .txt, .md, .docx`
                )
            );
            return;
        }
        cb(null, true);
    },
});

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function ensureUploadDir(): Promise<void> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function handleUploadedFile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const file = (req as Request & { file?: Express.Multer.File }).file;

        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const ext = path.extname(file.originalname).toLowerCase();
        let content: unknown;
        let contentHtml: string | undefined;

        if (ext === ".docx") {
            const result = await mammoth.convertToHtml({ buffer: file.buffer });
            contentHtml = result.value;
            content = { type: "doc", html: result.value };
        } else {
            const text = file.buffer.toString("utf-8");
            content = {
                type: "doc",
                content: [
                    { type: "paragraph", content: [{ type: "text", text }] },
                ],
            };
            contentHtml = `<p>${escapeHtml(text)}</p>`;
        }

        await ensureUploadDir();
        const storageKey = `${randomUUID()}-${file.originalname}`;
        await fs.writeFile(path.join(UPLOAD_DIR, storageKey), file.buffer);

        const savedFile = await prisma.file.create({
            data: {
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                storageKey,
                uploadedById: userId,
            },
        });

        const body = req.body as Record<string, unknown>;
        body.content = content;
        body.contentHtml = contentHtml;
        body.fileId = savedFile.id;
        if (!body.name) {
            body.name = path.basename(file.originalname, ext);
        }

        next();
    } catch (error) {
        next(error);
    }
}
