import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const createDocumentValidator = [
    body("projectId").isString().notEmpty().withMessage("Project id is required"),
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
    body("content").optional(),
    body("contentHtml").optional().isString(),
];

export const renameDocumentValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
    body("slug")
        .optional()
        .isString()
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage("Slug must be lowercase alphanumeric and hyphen-separated"),
];

export const updateContentValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    body("content").exists().withMessage("Content is required"),
    body("contentHtml").optional().isString(),
];

export const restoreVersionValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    body("versionNumber").isInt({ min: 1 }).withMessage("A positive version number is required"),
];

export const importAsDocumentValidator = [
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
    body("content").exists().withMessage("Content is required"),
    body("fileId").isString().notEmpty().withMessage("File id is required"),
    body("projectId").optional().isString(),
    body("contentHtml").optional().isString(),
];

export const importIntoDocumentValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    body("content").exists().withMessage("Content is required"),
    body("fileId").isString().notEmpty().withMessage("File id is required"),
    body("contentHtml").optional().isString(),
];

export const attachFileValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    body("fileId").isString().notEmpty().withMessage("File id is required"),
];

export const listDocumentsValidator = [
    query("projectId").optional().isString(),
];

export const documentIdParamValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
];

export const shareTokenParamValidator = [
    param("shareToken").isString().notEmpty().withMessage("Share token is required"),
];

export const shareDocumentValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    body("email").isString().trim().isEmail().withMessage("A valid email is required"),
    body("permission").optional().isIn(["read", "edit"]).withMessage("Permission must be read or edit"),
];

export const unshareDocumentValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
    param("shareId").isString().notEmpty().withMessage("Share id is required"),
];

export const listSharesValidator = [
    param("id").isString().notEmpty().withMessage("Document id is required"),
];

export function handleValidationErrors(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
}
