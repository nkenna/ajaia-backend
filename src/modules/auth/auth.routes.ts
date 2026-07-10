import { Router } from "express";
import authController from "./auth.controller";
import {
    registerValidator,
    loginValidator,
    logoutValidator,
    handleValidationErrors,
} from "./auth.validator";

const authRouter = Router();

authRouter.post(
    "/register",
    registerValidator,
    handleValidationErrors,
    authController.register
);

authRouter.post(
    "/login",
    loginValidator,
    handleValidationErrors,
    authController.login
);

authRouter.post(
    "/logout",
    logoutValidator,
    handleValidationErrors,
    authController.logout
);

export default authRouter;
