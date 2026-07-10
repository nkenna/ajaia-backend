import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const createProjectValidator = [
    body("name").isString().trim().notEmpty().withMessage("Project name is required"),
    body("slug")
        .isString()
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage("Slug must be lowercase alphanumeric and hyphen-separated"),
    body("description").optional().isString().trim(),
];

export const editProjectValidator = [
    param("id").isString().notEmpty().withMessage("Project id is required"),
    body("name").isString().trim().notEmpty().withMessage("Project name is required"),
    body("slug")
        .isString()
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage("Slug must be lowercase alphanumeric and hyphen-separated"),
    body("description").optional().isString().trim(),
];

export const deleteProjectValidator = [
    param("id").isString().notEmpty().withMessage("Project id is required"),
];

export const listProjectsValidator = [
    param("userId").isString().notEmpty().withMessage("User id is required"),
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
