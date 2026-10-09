/**
 * Flujo:
 *   1. dumpSchemaAndRoles()  → pg_dump -s + pg_dumpall --roles-only (solo lectura, read-only pool/rol)
 *   2. startTempContainer()  → Postgres nuevo y vacío en Docker
 *   3. restoreInto()         → psql corre los dos .sql dentro del contenedor
 *   4. se devuelve un Pool apuntando al contenedor, listo para que
 *      packages/core arme el DatabaseSnapshot (fase 3 del roadmap) a partir
 *      de él, sin volver a tocar la base real.
 *
 * Quien use createSnapshot() es responsable de llamar a `cleanup()` cuando
 * termine (lo ideal: en un try/finally), para cerrar el Pool, detener el
 * contenedor y borrar los .sql temporales del disco.
 */

import {rm} from 'node:fs/promises';
import {execFile } from 'node:child_process';
import {promisify} from 'node:util';
import {Pool} from 'pg';
import { dumpSchemaAndRoles, type AuditConnectionConfig, type SchemaSnapshotFiles } from "./dumpSchema.js";
import { startTempContainer, stopTempContainer, type TempContainer } from "./tempContainer.js";


const execFileAsync = promisify(execFile);

export interface DatabaseSnapshotHandle {
  pool: Pool;
  cleanup: () => Promise<void>;
  container?: TempContainer;
}

export async function createSnapshot(auditConfig?: AuditConnectionConfig): Promise<DatabaseSnapshotHandle> {
  const files = await dumpSchemaAndRoles(auditConfig);
  let container: TempContainer;
  try {
    container = await startTempContainer();
  } catch (err) {
    await rm(files.dir, {recursive: true, force: true});
    throw err;
  }

  try {
    await restoreInto(container, files);
  } catch (err) {
    await stopTempContainer(container);
    await rm(files.dir, {recursive: true, force: true});
    throw err;
  }

  const pool = new Pool({
    host: container.host,
    port: container.port, 
    user: container.user,
    password: container.password,
    database: container.database,
    max: 1, // solo necesitamos 1 conexión para el snapshot
  });

  const cleanup = async () => {
    await pool.end();
    await stopTempContainer(container);
    await rm(files.dir, {recursive: true, force: true});
  };

  return { pool, cleanup, container };
}

//Corre los dos .sql dentro del contenedor, en orden: primero roles y después esquema.
async function restoreInto(container: TempContainer, files: SchemaSnapshotFiles): Promise<void> {
  const env = { ...process.env, PGPASSWORD: container.password };
  const baseArgs = [
    `--host=${container.host}`,
    `--port=${container.port}`,
    `--username=${container.user}`,
    `--dbname=${container.database}`,
    "--set=ON_ERROR_STOP=1",
    "--no-psqlrc",
    "--pset=pager=off",
    "--no-password"
  ];

  try {
    await execFileAsync("psql", [...baseArgs, "-f", files.roleSqlPath], { env });
    await execFileAsync("psql", [...baseArgs, "-f", files.schemaSqlPath], { env });
  } catch (err) {
    throw new Error(`No se pudo restaurar el snapshot en el contenedor temporal: ${(err as Error).message}`);
  }
}