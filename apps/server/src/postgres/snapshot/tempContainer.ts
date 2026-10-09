//Este es el contenedor donde se restaura el dump de esquema

import {execFile} from "node:child_process";
import { randomBytes } from "node:crypto";
import {promisify} from "node:util";
import {Client} from "pg";

const execFileAsync = promisify(execFile);

export interface TempContainer {
  containerName: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const IMAGE = "postgres:16-alpine";
const INTERNAL_PORT = 5432;
const READY_TIMEOUT_MS = 15_000; // 15 segundos
const READY_POLL_INTERVAL_MS = 500; // 0.5 segundos

//Pregunta a Docker a qué puerto del host quedó mapeado el puerto 5432 interno.
async function getMappedPort(containerName: string): Promise<number> {
  const {stdout} = await execFileAsync("docker", [
    "port",
    containerName,
    String(INTERNAL_PORT),
  ]);

  // La salida tiene forma "0.0.0.0:54321" 
  const match = stdout.trim().match(/:(\d+)$/);
  if (!match) {
    throw new Error(`No se pudo obtener el puerto mapeado del contenedor ${containerName}. Salida de docker port: ${stdout}`);
  }
  return Number(match[1]);
}

//El contenedor queda "corriendo" antes de que Postgres adentro esté listo para aceptar conexiones
async function waitUntilReady(container: TempContainer): Promise<void> {
  const deadline = Date.now() +  READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const client = new Client({
      host: container.host,
      port: container.port,
      user: container.user,
      password: container.password,
      database: container.database,
      connectionTimeoutMillis: 2000,
    });

    try {
      await client.connect();
      await client.end();
      return; // Si la conexión fue exitosa, el contenedor está listo
    } catch (error) {
       await client.end().catch(() => undefined);
      // Si falla, esperamos un poco y reintentamos
      await new Promise(resolve => setTimeout(resolve, READY_POLL_INTERVAL_MS));
    }
  }

  throw new Error(`El contenedor ${container.containerName} no respondió a tiempo (esperado: ${READY_TIMEOUT_MS} ms)`);
}

export async function stopTempContainer(container: TempContainer): Promise<void> {
  await execFileAsync("docker", [
    "stop",
    container.containerName,
  ]).catch((error) => {
    console.error(`No se pudo detener el contenedor ${container.containerName}. Detalle: ${(error as Error).message}`);
  });
} 

/**
 * Arranca el contenedor y espera a que Postgres acepte conexiones
 * antes de devolver el control.
 */
export async function startTempContainer(): Promise<TempContainer> {
  const containerName = `pgarmor-snapshot-${randomBytes(4).toString("hex")}`;
  const password = randomBytes(16).toString("hex");
  const database = "snapshot";
  const user = "postgres";

  try {
    await execFileAsync("docker", [
      "run",
      "--rm",// Docker borra el contenedor solo en cuanto se detiene
      "-d", // detached: no bloquea esperando que el contenedor termine
       "-P",
      "-e",
      'POSTGRES_PASSWORD=' + password,
      "-e",
      'POSTGRES_DB=' + database,
      "--name",
      containerName,
      IMAGE,
    ]); 
  } catch (error) {
    throw new Error(`No se pudo levantar el contenedor temporal (¿Docker está corriendo?). Detalle: ${(error as Error).message}`);
  }

  const port = await getMappedPort(containerName);
  const container: TempContainer = {
    containerName,
    host: "localhost",
    port,
    user,
    password,
    database,
  };

  await waitUntilReady(container);
  return container; 
}
