# pgArmor

> ⚠️ **Estado del proyecto:** pgArmor está en una etapa inicial de desarrollo. La arquitectura, funcionalidades y reglas de análisis todavía están siendo construidas y pueden cambiar.

## ¿Qué queremos construir?

pgArmor busca convertirse en una herramienta open source para **analizar la configuración de seguridad de bases de datos PostgreSQL** y ayudar a detectar configuraciones que puedan representar riesgos.

El enfoque inicial estará principalmente en:

- Row Level Security (RLS)
- Policies
- Roles
- Permisos y grants
- Acceso a schemas y tablas
- Configuraciones inseguras o inconsistentes
- Recomendaciones de mejora

La primera versión será una aplicación web que se ejecutará como servidor y permitirá conectarse a una instancia PostgreSQL para obtener información, analizarla y mostrar hallazgos.

## Idea general

```text
Usuario
  ↓
Interfaz web
  ↓
API Express
  ↓
Adaptador PostgreSQL
  ↓
Snapshot de la base
  ↓
Motor de análisis
  ↓
Hallazgos y recomendaciones
```

El objetivo es mantener el motor de análisis desacoplado de la interfaz y del servidor para que, en el futuro, pueda reutilizarse en otras formas de distribución.

## Stack inicial

- TypeScript
- Node.js
- Express
- React + Vite
- PostgreSQL
- node-postgres (`pg`)
- Zod
- Vitest
- pnpm
- Docker

## Estructura inicial

```text
apps/
  web/
  server/

packages/
  core/
  postgres/
  shared/

docs/
```

### `apps/web`
Interfaz gráfica de la aplicación.

### `apps/server`
Servidor HTTP y API con Express.

### `packages/core`
Motor de análisis y reglas de seguridad.

### `packages/postgres`
Conexión, introspección y normalización de información obtenida desde PostgreSQL.

### `packages/shared`
Tipos, contratos y utilidades compartidas.

## Estado actual

El proyecto se encuentra construyendo su base técnica. Antes de considerar una versión estable se deben completar:

1. Infraestructura y estructura del proyecto.
2. Conexión e introspección de PostgreSQL.
3. Modelo común de datos.
4. Motor de reglas.
5. Primer conjunto de análisis de seguridad.
6. Interfaz para visualizar resultados.

Consulta [`docs/ROADMAP.md`](./docs/ROADMAP.md) para ver el plan de desarrollo.

## Desarrollo y contribución

Antes de comenzar a trabajar revisa:

- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## Licencia

Consulta [`LICENSE`](./LICENSE).
