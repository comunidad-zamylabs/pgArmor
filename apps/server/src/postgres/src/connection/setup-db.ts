/**
Script de configuración inicial de la base de datos.
 
Se conecta a Postgres con un usuario SUPERUSUARIO, corre el SQL de
audit-role.sql para crear (o actualizar) el rol de auditoría, y le
pone la contraseña que definiste en tu .env.
 
Existe para que cualquier persona del equipo, con solo correr "pnpm db:setup",
termine con el mismo usuario de auditoría configurado,
sin tener que copiar comandos SQL a mano.
*/

import { readFileSync } from "node:fs";
import {join, dirname} from "node:path";
import { fileURLToPath } from "node:url";
import {Client} from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env desde la raíz de pgArmor
dotenv.config({
  path: join(__dirname, "../../../../../../.env"),
});

async function setupDb(): Promise<void> {
  const superuserConfig = {
    host: process.env.DB_SETUP_HOST ?? "localhost",
    port: Number(process.env.DB_SETUP_PORT ?? 5432),
    user: process.env.DB_SETUP_USER ?? "postgres",
    password: process.env.DB_SETUP_PASSWORD ,
    database: process.env.DB_SETUP_DATABASE ?? "postgres",
  };

  const auditPassword = process.env.PGARMOR_AUDIT_PASSWORD;

  if (!auditPassword) {
    throw new Error(
      "Falta PGARMOR_AUDIT_PASSWORD en tu .env. Revisá .env.example."
    );
  }

  const client = new Client(superuserConfig);

  try {
    await client.connect();

    // Leer el archivo SQL como texto plano
    const sqlPath = join(__dirname, "audit-role.sql");
    const sql = readFileSync(sqlPath, "utf8");

    // Correr el script
    await client.query(sql,);
    // Setear la contraseña real
    await client.query(`ALTER ROLE pgarmor_audit WITH PASSWORD '${auditPassword}';`);
    console.log("Rol de auditoría configurado correctamente.");
  } finally {
    // Cerramos la conexión de superusuario.
    await client.end();
   }   
}

setupDb().catch((err) => {
  console.error("Error al configurar la base de datos:", err);
  process.exit(1);
});
