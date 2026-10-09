/**
 * Genera, el "snapshot" que pgArmor va a analizar.
 *
 * Por qué dos dumps separados:
 * `pg_dump --schema-only` trae la estructura de la base que se audita:
 * tablas, índices, políticas RLS y los GRANT sobre esos objetos. NO trae ninguna fila de datos.
 * `pg_dump` NO incluye los roles en sí. Para poder analizar roles hace falta `pg_dumpall --roles-only`, aparte.
 *
 * Ninguno de los dos dumps requiere una conexión que escriba nada: ambos usan
 * el mismo rol de solo lectura (pgarmor_audit) que ya se creó.
 */

import {execFile} from "node:child_process"
import {promisify} from "node:util"
import {join} from "node:path"
import {mkdir, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"

const execFileAsync = promisify(execFile)


// Los datos mínimos para que pg_dump/pg_dumpall sepan a qué servidor conectarse y con qué usuario.
export interface AuditConnectionConfig {
  host: string
  port: number
  user: string
  password: string | undefined
  database: string;
}

// Lo que le devolvemos a quien llame a dumpSchemaAndRoles()
// Ruta dónde quedaron los dos .sql, para que create-snapshot.ts los pueda restaurar después en el contenedor temporal.
export interface SchemaSnapshotFiles {
  dir: string; 
  schemaSqlPath: string; 
  roleSqlPath: string; 
}

//Lee la config de conexión a la base auditada desde las mismas variables de entorno que ya usa `pool.ts`
export function readAuditConnectionConfig(): AuditConnectionConfig {
  return { 
    host: process.env.PGARMOR_DB_HOST || "localhost",
    port: parseInt(process.env.PGARMOR_DB_PORT || "5432"),
    user: process.env.PGARMOR_DB_USER || "postgres",
    password: process.env.PGARMOR_DB_PASSWORD || "postgres",
    database: process.env.PGARMOR_DB_NAME || "postgres",
  }
}

// pg_dump y pg_dumpall leen la contraseña de la variable de entorno
function withPassword(config: AuditConnectionConfig): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PGPASSWORD: config.password || "",
  };
}

export async function dumpSchemaAndRoles(
  config: AuditConnectionConfig = readAuditConnectionConfig()
): Promise<SchemaSnapshotFiles> {
  
  const dir = join(tmpdir(), `pgarmor-dump-${Date.now()}`);//donde van a vivir los dos .sql mientras dura este snapshot.
  await mkdir(dir, {recursive: true});// recursive:true evita que falle si tmpdir() no existe todavía o si la carpeta ya está creada
  const schemaSqlPath = join(dir, "schema.sql");
  const roleSqlPath = join(dir, "roles.sql");
  const env = withPassword(config);
  

  // Argumentos para pg_dump: queremos SOLO la estructura (--schema-only),
  // Que escriba directo a un archivo (--file) en vez de imprimir por stdout.
  const schemaArgs = [
    "--schema-only",
    "--no-owner",
    "--host", config.host,
    "--port", config.port.toString(),
    "--username", config.user,
    "--dbname", config.database, 
    "--file", schemaSqlPath,
  ];

  const roleArgs = [
    "--roles-only",
    "--no-role-passwords", // no queremos hashes de contraseña en el snapshot
    "--host", config.host,
    "--port", config.port.toString(),
    "--username", config.user,
  ];

  try {
    await execFileAsync("pg_dump", schemaArgs, {env});
  } catch (error) {
    throw new Error(`pg_dump falló generando el dump de esquema. ¿Está pg_dump instalado y en el PATH? Detalle: ${(error as Error).message}`);
  }

  try {
    // pg_dumpall no tiene --file; su salida va por stdout.
    const {stdout} = await execFileAsync("pg_dumpall", roleArgs, {env});
    const rolesSql = stdout.split("\n")
    .filter((line) => !/^CREATE ROLE\s+"?postgres"?\b/.test(line)).join("\n");
    await writeFile(roleSqlPath, rolesSql, "utf-8");
  } catch (error) {
    throw new Error(`pg_dumpall falló generando el dump de roles. Detalle: ${(error as Error).message}`);
  }

  return { dir, schemaSqlPath, roleSqlPath }; 
}