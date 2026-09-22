import "dotenv/config";
import pg from "pg";
import z from "zod";

const { Pool } = pg;

const postgres_env_schema = z.object({
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.coerce
        .number()
        .int()
        .min(1000, "DATABASE_PORT no debe ser menor a 1000")
        .max(9999, "DATABASE_PORT no debe ser mayor a 9999"),
    DATABASE_NAME: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z
        .string()
        .min(6, "DATABASE_PASWORD no puede tener menos de 6 digitos"),
    DATABASE_CONNECTION_TIMEOUT: z.coerce
        .number()
        .int()
        .min(1, "DATABASE_CONNECTION_TIMEOUT debe ser mayor a 0"),
    MAX: z.coerce.number().int().min(1, "MAX debe ser como mínimo 1"),
});

const env = postgres_env_schema.safeParse(process.env);

if (!env.success) {
    console.error("Configuración de PostgreSQL inválida:");

    for (const issue of env.error.issues) {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }

    throw new Error("La configuración de PostgreSQL es inválida.");
}

export const pool = new Pool({
    host: env.data.DATABASE_HOST,
    port: env.data.DATABASE_PORT,
    database: env.data.DATABASE_NAME,
    user: env.data.DATABASE_USER,
    password: env.data.DATABASE_PASSWORD,
    connectionTimeoutMillis: env.data.DATABASE_CONNECTION_TIMEOUT,
    max: env.data.MAX,
    idleTimeoutMillis: 30000,
});