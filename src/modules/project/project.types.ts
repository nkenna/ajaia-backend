export interface CreateProjectInputData {
    userId: string;
    name: string;
    description?: string;
}

export interface EditProjectInputData {
    id: string;
    userId: string;
    name: string;
    slug: string;
    description?: string;
}

export interface DeleteProjectInputData {
    id: string;
    userId: string;
}

export interface ListProjectsInputData {
    userId: string;
}
