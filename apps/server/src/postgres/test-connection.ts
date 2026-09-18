import { pool } from "./connection/postgres.js"

async function testConnection() {
  try {
    console.log("nice1")
    const result = await pool.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
`);

    console.log("Conexión exitosa");
    console.log("Usuario:", result);
    console.log("Base de datos:");
  } catch (error) {
    console.error("Error de conexión:", error);
  } finally {
    await pool.end();
  }
}

testConnection();