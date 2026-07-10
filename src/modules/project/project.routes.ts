import { Router } from "express";
import projectController from "./project.controller";
import { authenticate } from "../../middlewares/auth";
import {
    createProjectValidator,
    editProjectValidator,
    deleteProjectValidator,
    listProjectsValidator,
    handleValidationErrors,
} from "./project.validator";

const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.post(
    "/",
    createProjectValidator,
    handleValidationErrors,
    projectController.create
);

projectRouter.get(
    "/:userId",
    listProjectsValidator,
    handleValidationErrors,
    projectController.list
);

projectRouter.put(
    "/:id",
    editProjectValidator,
    handleValidationErrors,
    projectController.edit
);

projectRouter.delete(
    "/:id",
    deleteProjectValidator,
    handleValidationErrors,
    projectController.delete
);

export default projectRouter;
