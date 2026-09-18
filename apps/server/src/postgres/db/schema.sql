-- crar rol ' pgarmor_auditor '
CREATE ROLE pgarmor_auditor
LOGIN
PASSWORD 'contraseñaPro9132';

-- Dar acceso a la base de datos
GRANT CONNECT ON DATABASE pgarmor
TO pgarmor_auditor;

-- Dar permisos de solo lectura
GRANT pg_read_all_data
TO pgarmor_auditor; 

-- Verificar configuración del usuario
SELECT
    rolname,
    rolcanlogin,
    rolsuper,
    rolcreatedb,
    rolcreaterole,
    rolbypassrls
FROM pg_roles
WHERE rolname = 'pgarmor_auditor';

-- Verificar el rol 'pg_read_all_data'
SELECT
    pg_get_userbyid(member) AS usuario,
    pg_get_userbyid(roleid) AS rol
FROM pg_auth_members
WHERE member = (
    SELECT oid
    FROM pg_roles
    WHERE rolname = 'pgarmor_auditor'
);