import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const updateUserInfoValidator = [
    body("firstName").optional().isString().trim().notEmpty().withMessage("First name must be a non-empty string"),
    body("lastName").optional().isString().trim().notEmpty().withMessage("Last name must be a non-empty string"),
];

export const changePasswordValidator = [
    body("currentPassword").isString().notEmpty().withMessage("Current password is required"),
    body("newPassword")
        .isString()
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters"),
];

export const deleteAccountValidator = [
    body("password").isString().notEmpty().withMessage("Password is required to delete the account"),
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
