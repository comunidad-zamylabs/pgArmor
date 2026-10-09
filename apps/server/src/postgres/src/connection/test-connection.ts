/**
 * Función simple para confirmar que la conexión de solo lectura funciona.
 */

import { readOnlyPool } from "./pool.js";

export async function testConnection(): Promise<string> {
  const result = await readOnlyPool.query<{ version: string | null }>(
    "SELECT version()"
  );
  const version = result.rows[0]?.version ?? "unknown";
  return version;
}