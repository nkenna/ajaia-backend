import { prisma } from "../../lib/prisma";
import {
    CreateProjectInputData,
    EditProjectInputData,
    DeleteProjectInputData,
    ListProjectsInputData,
} from "./project.types";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertValidSlug(slug: string): void {
    if (!SLUG_REGEX.test(slug)) {
        throw new Error(
            "Slug must be lowercase alphanumeric and hyphen-separated (e.g. 'my-project')"
        );
    }
}

function slugify(name: string): string {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "untitled";
}

class ProjectService {
    async createProject(inputData: CreateProjectInputData) {
        const slugBase = slugify(inputData.name);

        let slug = slugBase;
        let attempt = 0;
        while (
            await prisma.project.findFirst({
                where: { slug, userId: inputData.userId },
                select: { id: true },
            })
        ) {
            attempt += 1;
            slug = `${slugBase}-${attempt}`;
        }

        return prisma.project.create({
            data: {
                userId: inputData.userId,
                name: inputData.name,
                slug,
                description: inputData.description,
            },
        });
    }

    async assertProjectOwnership(projectId: string, userId: string): Promise<void> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.userId !== userId) {
            throw new Error("You do not have permission to access this project");
        }
    }

    async editProject(inputData: EditProjectInputData) {
        await this.assertProjectOwnership(inputData.id, inputData.userId);

        assertValidSlug(inputData.slug);

        const conflicting = await prisma.project.findFirst({
            where: {
                slug: inputData.slug,
                userId: inputData.userId,
                NOT: { id: inputData.id },
            },
            select: { id: true },
        });

        if (conflicting) {
            throw new Error("A project with this slug already exists for this user");
        }

        return prisma.project.update({
            where: { id: inputData.id },
            data: {
                name: inputData.name,
                slug: inputData.slug,
                description: inputData.description,
            },
        });
    }

    async deleteProject(inputData: DeleteProjectInputData) {
        await this.assertProjectOwnership(inputData.id, inputData.userId);

        return prisma.project.delete({
            where: { id: inputData.id },
        });
    }

    async listProjects(inputData: ListProjectsInputData) {
        return prisma.project.findMany({
            where: { userId: inputData.userId },
            orderBy: { createdAt: "desc" },
        });
    }
}

export default new ProjectService();
