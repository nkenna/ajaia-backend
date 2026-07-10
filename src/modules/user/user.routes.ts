import { Router } from "express";
import userController from "./user.controller";
import { authenticate } from "../../middlewares/auth";
import {
    updateUserInfoValidator,
    changePasswordValidator,
    deleteAccountValidator,
    handleValidationErrors,
} from "./user.validators";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", handleValidationErrors, userController.getUserInfo);

userRouter.patch(
    "/me",
    updateUserInfoValidator,
    handleValidationErrors,
    userController.updateUserInfo
);

userRouter.post(
    "/me/password",
    changePasswordValidator,
    handleValidationErrors,
    userController.changePassword
);

userRouter.delete(
    "/me",
    deleteAccountValidator,
    handleValidationErrors,
    userController.deleteAccount
);

export default userRouter;
