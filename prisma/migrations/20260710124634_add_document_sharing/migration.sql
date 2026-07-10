-- CreateTable
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentShare_sharedWithId_idx" ON "DocumentShare"("sharedWithId");

-- CreateIndex
CREATE INDEX "DocumentShare_documentId_idx" ON "DocumentShare"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentShare_documentId_sharedWithId_key" ON "DocumentShare"("documentId", "sharedWithId");

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
