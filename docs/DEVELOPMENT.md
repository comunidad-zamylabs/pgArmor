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
