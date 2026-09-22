import { pool } from "./connection/postgres.js"

async function testConnection() {
  try {

    const result = await pool.query("SELECT current_user, current_database()");

    console.log("Conexión exitosa");
    console.log("Usuario: ", result.rows[0]["current_user"]);
    console.log("Base de datos: ", result.rows[0]["current_database"]);
    console.log("resultado: ", result)
  } catch (error) {
    console.error("Error de conexión:", error);
  } finally {
    await pool.end();
  }
}

testConnection();