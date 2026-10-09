/**
 * Hace exactamente la secuencia pedida:
 *   1. createSnapshot() → levanta el contenedor Y restaura el dump de
 *      esquema/roles ADENTRO
 *   2. Corre setup-db.ts, pero apuntado a ESTE contenedor (no a tu Postgres
 *      local), pasándole DB_SETUP_* por variables de entorno del proceso
 *      hijo en vez de dejar que lea tu .env.
 *   3. Verifica con una query directa a pg_roles que pgarmor_audit haya
 *      quedado creado.
 *   4. Según PGARMOR_SNAPSHOT_KEEP, destruye el contenedor (comportamiento
 *      por defecto) o lo deja vivo e imprime cómo conectarte a mano.
 *
 * Correr con:
 *   pnpm tsx src/postgres/snapshot/setupAndVerify.ts
 *
 * Para dejar el contenedor vivo en vez de destruirlo al final:
 *   $env:PGARMOR_SNAPSHOT_KEEP = "1"
 */
import dotenv from "dotenv";
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSnapshot } from "./createSnapshot.js";
import type { TempContainer } from "./tempContainer.js";


const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", "..", "..", "..", "..", ".env") });

const SETUP_DB_PATH = join(__dirname, "..", "src", "connection", "setup-db.ts");

async function main(): Promise<void> {
  console.log("1) Levantando contenedor y restaurando el snapshot adentro...");
  const { pool, cleanup, container } = await createSnapshot();
  if (!container) {
    await cleanup();
    throw new Error("No se pudo crear el contenedor del snapshot.");
  }
  console.log(`Contenedor listo: ${container.containerName} (puerto ${container.port})`);

  try {
    console.log("2) Corriendo setup-db.ts apuntando al contenedor...");
    await runSetupDb(container);

    console.log("3) Verificando que pgarmor_audit haya quedado creado...");
    const result = await pool.query(
      `SELECT rolname, rolsuper, rolcreaterole, rolcreatedb
       FROM pg_roles WHERE rolname = 'pgarmor_audit'`
      );
    
      if (result.rowCount === 0) {
        throw new Error("No se encontró el rol pgarmor_audit en la base de datos del snapshot.");
      }
      console.log("Rol pgarmor_audit encontrado:", result.rows[0]);
    } finally {
      if (process.env.PGARMOR_SNAPSHOT_KEEP) {
        console.log("\n4) PGARMOR_SNAPSHOT_KEEP está activo: dejo el contenedor vivo.");
        console.log(`host=${container.host} 
          port=${container.port} 
          user=${container.user} 
          password=${container.password} 
          database=${container.database}`
      );

      console.log(`Para destruirlo manualmente, corre: docker stop ${container.containerName} && docker rm ${container.containerName}`);
      await pool.end();
    } else {
      console.log("4) Limpiando: cerrando pool, deteniendo contenedor y borrando archivos temporales...");
      await cleanup();
    }
  }    
}

async function runSetupDb(container: TempContainer): Promise<void> {
  const env = {
    ...process.env,
    DB_SETUP_HOST: container.host,
    DB_SETUP_PORT: container.port.toString(),
    DB_SETUP_USER: container.user,
    DB_SETUP_PASSWORD: container.password,
    DB_SETUP_DATABASE: container.database,
  };

  try {
    const { stdout } = await execFileAsync('pnpm', ["exec", "tsx", SETUP_DB_PATH],{
    env,
    shell: true,
  });
  if (stdout.trim()) console.log(`   ${stdout.trim()}`);
  } catch (err) {
    throw new Error(`setup-db.ts falló contra el contenedor. Detalle: ${(err as Error).message}`);  
  }
}

main().catch(err => {
  console.error("Error en setupAndVerify:", err);
  process.exit(1);
});
