import "dotenv/config";

function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === "") {
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
}

const nodeEnv = (process.env.NODE_ENV ?? "development").toLowerCase();

const config = {
    nodeEnv,
    isProduction: nodeEnv === "production",

    port: Number(process.env.PORT ?? 4000),

    databaseUrl: required("DATABASE_URL"),

    jwtSecret: required("JWT_SECRET"),
    accessTokenTtl: "15m",
    refreshTokenTtlDays: 30,

    uploadDir: process.env.UPLOAD_DIR ?? "uploads",
    maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024),

    prisma: {
        max: Number(process.env.DB_POOL_MAX ?? 50),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
    },

    cors: {
        origin: process.env.CORS_ORIGIN ?? true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    },
};

export default config;
