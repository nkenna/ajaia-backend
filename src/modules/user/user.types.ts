export interface UpdateUserInfoInputData {
    userId: string;
    firstName?: string;
    lastName?: string;
}

export interface ChangePasswordInputData {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export interface GetUserInfoInputData {
    userId: string;
}

export interface DeleteAccountInputData {
    userId: string;
    password: string;
}
