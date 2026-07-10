import argon2 from "argon2";
import { prisma } from "../../lib/prisma";
import { RegisterInputData, RegisterResult, LoginInputData, LoginResult, LogoutInputData } from "./auth.types";
import {
    generateRandomToken,
    signAccessToken,
    computeExpiry,
    REFRESH_TOKEN_TTL_DAYS,
} from "../../lib/token.service";
import projectService from "../project/project.service";

class AuthService {
    async register(inputData: RegisterInputData): Promise<RegisterResult> {
        const existingUser = await prisma.user.findUnique({
            where: { email: inputData.email },
        });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const passwordHash = await argon2.hash(inputData.password);

        const sessionToken = generateRandomToken();
        const refreshToken = generateRandomToken();

        const { user, session } = await prisma.$transaction(
            async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: inputData.email,
                        passwordHash,
                        firstName: inputData.firstName,
                        lastName: inputData.lastName,
                    },
                });

                const session = await tx.session.create({
                    data: {
                        token: sessionToken,
                        userId: user.id,
                        expiresAt: computeExpiry(REFRESH_TOKEN_TTL_DAYS),
                    },
                });

                await tx.refreshToken.create({
                    data: {
                        token: refreshToken,
                        userId: user.id,
                        sessionId: session.id,
                        expiresAt: computeExpiry(REFRESH_TOKEN_TTL_DAYS),
                    },
                });

                return { user, session };
            },
            { timeout: 10000 }
        );

        const accessToken = await signAccessToken(user.id, session.id);

        void projectService
            .createProject({
                userId: user.id,
                name: "default",
            })
            .catch((error) => {
                console.error("Failed to create default project:", error);
            });

        const { passwordHash: _passwordHash, ...safeUser } = user;

        return {
            user: safeUser,
            accessToken,
            refreshToken,
            sessionToken,
        };
    }

    async login(inputData: LoginInputData): Promise<LoginResult> {
        const user = await prisma.user.findUnique({
            where: { email: inputData.email },
        });

        if (!user) {
            throw new Error("Invalid email or password");
        }

        const passwordValid = await argon2.verify(user.passwordHash, inputData.password);

        if (!passwordValid) {
            throw new Error("Invalid email or password");
        }

        const sessionToken = generateRandomToken();
        const refreshToken = generateRandomToken();

        const { session } = await prisma.$transaction(
            async (tx) => {
                const session = await tx.session.create({
                    data: {
                        token: sessionToken,
                        userId: user.id,
                        expiresAt: computeExpiry(REFRESH_TOKEN_TTL_DAYS),
                    },
                });

                await tx.refreshToken.create({
                    data: {
                        token: refreshToken,
                        userId: user.id,
                        sessionId: session.id,
                        expiresAt: computeExpiry(REFRESH_TOKEN_TTL_DAYS),
                    },
                });

                return { session };
            },
            { timeout: 10000 }
        );

        const accessToken = await signAccessToken(user.id, session.id);

        const { passwordHash: _passwordHash, ...safeUser } = user;

        return {
            user: safeUser,
            accessToken,
            refreshToken,
            sessionToken,
        };
    }

    async logout(inputData: LogoutInputData): Promise<void> {
        const session = await prisma.session.findUnique({
            where: { token: inputData.sessionToken },
        });

        if (!session) {
            throw new Error("Session not found");
        }

        await prisma.$transaction(
            async (tx) => {
                await tx.refreshToken.updateMany({
                    where: { sessionId: session.id },
                    data: { revoked: true },
                });

                await tx.session.delete({
                    where: { id: session.id },
                });
            },
            { timeout: 10000 }
        );
    }
}

export default new AuthService()