import "dotenv/config"
import pg from "pg";

const { Pool } = pg

export const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT),
    max: Number(process.env.MAX),
    idleTimeoutMillis: 30000,
})

// DATABASE_SESSION_MAX_AGE_HOURS=24

// DATABASE_CONNECTION_TIMEOUT=5000

// DATABASE_HOST=localhost
// DATABASE_NAME=pgarmor
// DATABASE_PORT=5432
// DATABASE_USER=pgarmor_auditor
// DATABASE_PASSWORD="krascarpro"