# Desarrollo

Este documento describe el flujo esperado para trabajar en pgArmor.

El proyecto utiliza un flujo basado en **GitFlow**. El objetivo es evitar cambios directos sobre ramas estables y facilitar el trabajo de varios colaboradores al mismo tiempo.

## Ramas principales

### `main`

Representa código estable.

No se desarrolla directamente sobre esta rama.

No se permite:

```bash
git checkout main
# hacer cambios
git commit
git push origin main
```

Los cambios llegan a `main` mediante Pull Request desde una rama de release o hotfix.

### `develop`

Es la rama principal de integración durante el desarrollo.

Las nuevas funcionalidades y correcciones normales parten desde `develop` y regresan mediante Pull Request.

## Flujo para desarrollar una funcionalidad

### 1. Preparar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd pgArmor
pnpm install

git checkout develop
git pull origin develop
```

Si trabajas mediante fork, agrega también el repositorio principal como `upstream`.

### 2. Crear una rama

Nunca trabajes directamente sobre `main` o `develop`.

Para funcionalidades:

```bash
git checkout -b feature/nombre-corto
```

Para correcciones:

```bash
git checkout -b fix/nombre-corto
```

Ejemplos:

```text
feature/postgres-role-collector
feature/database-snapshot
fix/rls-policy-parser
docs/update-architecture
```

### 3. Desarrollar y enviar un Pull Request

Antes de subir cambios:

```bash
pnpm lint
pnpm test
pnpm build
```

Luego:

```bash
git add .
git commit -m "feat(postgres): add role collector"
git push -u origin feature/postgres-role-collector
```

Abre un Pull Request hacia:

```text
feature/* → develop
fix/*     → develop
docs/*    → develop
```

No abras un Pull Request normal directamente hacia `main`.

## GitFlow del proyecto

```text
feature/* ─┐
fix/* ─────┼──→ develop ───→ release/* ───→ main
docs/* ────┘

hotfix/* ────────────────────────────────→ main
   └────────────────────────────────────→ develop
```

### Releases

Cuando una versión esté lista:

```text
develop
   ↓
release/x.y.z
   ↓
main
```

Después del merge, los cambios deben quedar sincronizados nuevamente con `develop`.

### Hotfix

Solo para errores críticos existentes en una versión estable:

```text
main
 ↓
hotfix/x.y.z
 ↓
main + develop
```

## Commits

Usamos Conventional Commits.

Ejemplos:

```text
feat(core): add rule runner
fix(postgres): handle inherited roles
docs: explain database snapshot
test(core): add policy rule tests
refactor(server): simplify analysis service
```

## Antes de comenzar una tarea

Revisa primero si existe un Issue.

Si no existe, crea uno y describe:

- qué problema se quiere resolver;
- qué parte del proyecto afecta;
- propuesta general;
- posibles dudas técnicas.

Para cambios importantes en arquitectura, seguridad o reglas de análisis, discútelo antes de implementar.

## Reglas técnicas

Mantener siempre estas fronteras:

```text
apps/web
→ interfaz

apps/server
→ API y coordinación

packages/postgres
→ introspección y acceso a PostgreSQL

packages/core
→ análisis

packages/shared
→ tipos y contratos compartidos
```

No colocar reglas de seguridad en controllers, componentes React o consultas SQL.

## Pull Requests

Un PR debe incluir:

- Issue relacionado;
- resumen del cambio;
- cómo probarlo;
- tests cuando corresponda;
- documentación si cambia comportamiento o arquitectura.

Mantén los PR pequeños y enfocados. Evita mezclar refactors generales con una funcionalidad no relacionada.

## Desarrollo con Docker

Entorno de desarrollo reproducible con Docker Compose: levanta el frontend (`apps/web`, Vite) y el backend (`apps/server`, Express con `tsx watch`) en dos contenedores independientes, con recarga en caliente y sin base de datos. Es solo para desarrollo.

### Inicio rápido

1. Instala Docker con el plugin Compose.
2. Desde la raíz del repositorio:

```bash
docker compose up
```

El primer arranque descarga la imagen base e instala las dependencias con pnpm. Los arranques siguientes reutilizan el almacén de paquetes `pnpm-store` y son más rápidos.

Verifica que el stack responda:

| Comando | Resultado esperado |
|---|---|
| `curl http://localhost:3000/health` | `{"status":"ok"}` |
| `curl http://localhost:5173/api/health` | `{"status":"ok"}` |

El proxy de Vite expone `/api` hacia el backend (`server:3000`), por lo que el frontend puede llamar al backend desde el mismo origen sin CORS.

### Operaciones comunes

| Operación | Comando |
|---|---|
| Iniciar | `docker compose up` |
| Detener | `Ctrl+C`, o `docker compose down` |
| Reconstruir la imagen | `docker compose up --build` |
| Agregar una dependencia | `pnpm --filter web add <paquete>` o `pnpm --filter server add <paquete>` |
| Limpiar volúmenes | `docker compose down -v` |

Los cambios en el código se reflejan sin reconstruir la imagen gracias al bind mount `.:/app`. Después de agregar o actualizar dependencias, reinicia con `--build` y, si los volúmenes quedaron desactualizados, usa `docker compose down -v`.

### Solución de problemas

| Problema | Solución |
|---|---|
| La recarga en caliente no detecta cambios (Docker Desktop en macOS/Windows) | El sistema de archivos no emite eventos nativos; habilita el polling con `CHOKIDAR_USEPOLLING=true` (o `usePolling: true` en `server.watch` de `vite.config.ts`). |
| `corepack` no disponible (Node 25+ lo elimina) | Instala pnpm globalmente: `npm i -g pnpm@11.24.0` |
| Dependencias o volúmenes desactualizados | Ejecuta `docker compose down -v` y vuelve a iniciar con `docker compose up` |
