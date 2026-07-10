import { Router } from "express";
import documentController from "./document.controller";
import { authenticate } from "../../middlewares/auth";
import {
    createDocumentValidator,
    renameDocumentValidator,
    updateContentValidator,
    restoreVersionValidator,
    importAsDocumentValidator,
    importIntoDocumentValidator,
    attachFileValidator,
    listDocumentsValidator,
    documentIdParamValidator,
    shareTokenParamValidator,
    handleValidationErrors,
} from "./document.validator";
import { upload, handleUploadedFile } from "./document.upload";

const documentRouter = Router();

documentRouter.post(
    "/",
    authenticate,
    createDocumentValidator,
    handleValidationErrors,
    documentController.create
);

documentRouter.get(
    "/shared/:shareToken",
    shareTokenParamValidator,
    handleValidationErrors,
    documentController.getByShareToken
);

documentRouter.get(
    "/",
    authenticate,
    listDocumentsValidator,
    handleValidationErrors,
    documentController.list
);

documentRouter.get(
    "/:id",
    authenticate,
    documentIdParamValidator,
    handleValidationErrors,
    documentController.getOwned
);

documentRouter.get(
    "/:id/versions",
    authenticate,
    documentIdParamValidator,
    handleValidationErrors,
    documentController.listVersions
);

documentRouter.put(
    "/:id/rename",
    authenticate,
    renameDocumentValidator,
    handleValidationErrors,
    documentController.rename
);

documentRouter.put(
    "/:id/content",
    authenticate,
    updateContentValidator,
    handleValidationErrors,
    documentController.updateContent
);

documentRouter.post(
    "/:id/restore",
    authenticate,
    restoreVersionValidator,
    handleValidationErrors,
    documentController.restoreVersion
);

documentRouter.delete(
    "/:id",
    authenticate,
    documentIdParamValidator,
    handleValidationErrors,
    documentController.delete
);

documentRouter.post(
    "/import",
    authenticate,
    upload.single("file"),
    handleUploadedFile,
    importAsDocumentValidator,
    handleValidationErrors,
    documentController.importAsDocument
);

documentRouter.post(
    "/:id/import",
    authenticate,
    upload.single("file"),
    handleUploadedFile,
    importIntoDocumentValidator,
    handleValidationErrors,
    documentController.importIntoDocument
);

documentRouter.post(
    "/:id/files",
    authenticate,
    upload.single("file"),
    handleUploadedFile,
    attachFileValidator,
    handleValidationErrors,
    documentController.attachFile
);

export default documentRouter;
