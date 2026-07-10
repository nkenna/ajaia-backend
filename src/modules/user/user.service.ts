import argon2 from "argon2";
import { prisma } from "../../lib/prisma";
import {
    UpdateUserInfoInputData,
    ChangePasswordInputData,
    GetUserInfoInputData,
    DeleteAccountInputData,
} from "./user.types";

class UserService {
    async updateUserInfo(inputData: UpdateUserInfoInputData) {
        const user = await prisma.user.findUnique({
            where: { id: inputData.userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const data: { firstName?: string; lastName?: string } = {};

        if (inputData.firstName !== undefined) {
            data.firstName = inputData.firstName;
        }
        if (inputData.lastName !== undefined) {
            data.lastName = inputData.lastName;
        }

        return prisma.user.update({
            where: { id: inputData.userId },
            data,
            omit: { passwordHash: true },
        });
    }

    async changePassword(inputData: ChangePasswordInputData) {
        const user = await prisma.user.findUnique({
            where: { id: inputData.userId },
            select: { id: true, passwordHash: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const valid = await argon2.verify(user.passwordHash, inputData.currentPassword);
        if (!valid) {
            throw new Error("Current password is incorrect");
        }

        const passwordHash = await argon2.hash(inputData.newPassword);

        await prisma.$transaction(
            async (tx) => {
                await tx.user.update({
                    where: { id: inputData.userId },
                    data: { passwordHash },
                });

                await tx.refreshToken.updateMany({
                    where: { userId: inputData.userId },
                    data: { revoked: true },
                });

                await tx.session.deleteMany({
                    where: { userId: inputData.userId },
                });
            },
            { timeout: 10000 }
        );

        return { success: true };
    }

    async getUserInfo(inputData: GetUserInfoInputData) {
        const user = await prisma.user.findUnique({
            where: { id: inputData.userId },
            omit: { passwordHash: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async deleteAccount(inputData: DeleteAccountInputData) {
        const user = await prisma.user.findUnique({
            where: { id: inputData.userId },
            select: { id: true, passwordHash: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const valid = await argon2.verify(user.passwordHash, inputData.password);
        if (!valid) {
            throw new Error("Password is incorrect");
        }

        await prisma.user.delete({
            where: { id: inputData.userId },
        });

        return { success: true };
    }
}

export default new UserService();
