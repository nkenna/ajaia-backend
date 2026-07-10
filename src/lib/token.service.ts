import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import config from "../config/config";

const ACCESS_TOKEN_TTL = config.accessTokenTtl;
export const REFRESH_TOKEN_TTL_DAYS = config.refreshTokenTtlDays;

function getJwtSecret(): Uint8Array {
    return new TextEncoder().encode(config.jwtSecret);
}

export function generateRandomToken(): string {
    return randomBytes(32).toString("hex");
}

export async function signAccessToken(
    userId: string,
    sessionId: string
): Promise<string> {
    return new SignJWT({ sessionId })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .sign(getJwtSecret());
}

export function computeExpiry(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export interface AccessTokenPayload {
    userId: string;
    sessionId: string;
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
        userId: payload.sub as string,
        sessionId: (payload.sessionId as string) ?? "",
    };
}
