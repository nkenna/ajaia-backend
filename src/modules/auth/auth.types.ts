export interface RegisterInputData {
    email: string;
    password: string;
    firstName: string;
    lastName: string
}

export interface LoginInputData {
    email: string,
    password: string
}

export interface RegisterResult {
    user: Omit<RegisterInputData, "password"> & { id: string; createdAt: Date; updatedAt: Date };
    accessToken: string;
    refreshToken: string;
    sessionToken: string;
}

export interface LoginResult {
    user: Omit<LoginInputData, "password"> & { id: string; firstName: string; lastName: string; createdAt: Date; updatedAt: Date };
    accessToken: string;
    refreshToken: string;
    sessionToken: string;
}

export interface LogoutInputData {
    sessionToken: string;
}