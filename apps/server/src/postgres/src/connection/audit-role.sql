-- Este script define el rol (usuario) que pgArmor usa para AUDITAR una base

-- Reglas de este rol:
--   - LOGIN            → puede conectarse
--   - NOSUPERUSER      → nunca puede saltarse RLS ni ningún permiso
--   - NOCREATEDB       → no puede crear bases de datos nuevas
--   - NOCREATEROLE     → no puede crear ni modificar otros usuarios
--   - CONNECTION LIMIT → evita que un bug abra conexiones infinitas


-- Este bloque revisa primero si el rolya existe (en pg_roles) y solo lo crea si falta.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_roles WHERE rolname = 'pgarmor_audit') 
        THEN
        CREATE ROLE pgarmor_audit WITH
        LOGIN
        NOSUPERUSER
        NOCREATEDB
        NOCREATEROLE
        NOINHERIT
        CONNECTION LIMIT 5;
    END IF;
END $$;

-- pg_read_all_data es un rol PREDEFINIDO de Postgres.
-- Da SELECT sobre todas las tablas, vistas y secuencias de todos los schemas.
GRANT pg_read_all_data TO pgarmor_audit;

-- Cada sesión que abra va a comportarse como si la base entera fuera de solo lectura.
ALTER ROLE pgarmor_audit SET DEFAULT_TRANSACTION_READ_ONLY = ON;
