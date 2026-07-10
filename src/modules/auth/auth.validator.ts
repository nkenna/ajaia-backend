import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const registerValidator = [
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("password")
        .isString()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
    body("firstName").isString().trim().notEmpty().withMessage("First name is required"),
    body("lastName").isString().trim().notEmpty().withMessage("Last name is required"),
];

export const loginValidator = [
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
];

export const logoutValidator = [
    body("sessionToken").isString().notEmpty().withMessage("Session token is required"),
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
