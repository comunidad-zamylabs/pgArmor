/**
 * Pool de conexión de SOLO LECTURA a PostgreSQL.
 *
 * Este es el único punto del backend que se conecta a la base que se va a
 * auditar. 
 * 
 * No abrimos una conexión nueva por cada consulta,mantenemos un grupo pequeño de conexiones reutilizables, lo cual es más
 * eficiente y evita agotar el límite de conexiones de Postgres.
 */

import { Pool, type PoolConfig } from "pg";

const poolConfig: PoolConfig = {
  host: process.env.PGARMOR_DB_HOST ?? "localhost",
  port: Number(process.env.PGARMOR_DB_PORT ?? 5432),
  user: process.env.PGARMOR_DB_USER ?? "pgarmor_audit",
  password: process.env.PGARMOR_DB_PASSWORD,
  database: process.env.PGARMOR_DB_NAME ?? "pgarmor",

  connectionTimeoutMillis: 5000,

// Tiempo máximo que una conexión puede quedar inactiva en el pool antes de cerrarse sola.
  idleTimeoutMillis: 10000,

  // Cuántas conexiones simultáneas permitimos como máximo desde este pool.
  max: 5,
};

export const readOnlyPool = new Pool(poolConfig);

// Cada vez que el pool abre una conexión nueva, forzamos el modo de solo lectura
readOnlyPool.on("connect", (client) => {
  client.query("SET default_transaction_read_only = on;")
  .catch((err) => {
    console.error("No se pudo forzar modo solo lectura:", err);
  });
});
 
readOnlyPool.on("error", (err) => {
  console.error("Error en el pool de conexiones:", err);
});