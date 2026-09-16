# Roadmap

pgArmor se desarrollará por etapas. La prioridad inicial es construir primero un motor confiable de introspección y análisis antes de ampliar funcionalidades.

## Fase 1 — Base del proyecto

Objetivo: dejar una estructura estable para que varias personas puedan desarrollar en paralelo.

### Pasos

1. Configurar monorepo con pnpm.
2. Crear `apps/web` y `apps/server`.
3. Crear `packages/core`, `packages/postgres` y `packages/shared`.
4. Configurar TypeScript.
5. Configurar lint, tests y build.
6. Configurar CI en GitHub.
7. Proteger `main` y utilizar `develop` como rama de integración.

Resultado esperado:

```text
Proyecto instalable, ejecutable y preparado para recibir contribuciones.
```

## Fase 2 — Conexión e introspección PostgreSQL

Objetivo: poder conectarse a PostgreSQL y obtener información suficiente para analizar seguridad.

### Pasos

1. Implementar conexión mediante `pg`.
2. Detectar versión de PostgreSQL.
3. Obtener schemas y tablas.
4. Obtener roles y membresías.
5. Detectar estado de RLS.
6. Obtener policies.
7. Obtener grants y permisos.
8. Normalizar toda la información.

Resultado esperado:

```text
PostgreSQL
    ↓
DatabaseSnapshot
```

## Fase 3 — Modelo de análisis

Objetivo: definir cómo representa pgArmor una base y sus problemas.

### Pasos

1. Definir `DatabaseSnapshot`.
2. Definir `Finding`.
3. Definir severidades y categorías.
4. Definir contrato de una regla.
5. Crear el ejecutor de reglas.
6. Crear fixtures de bases seguras e inseguras.

Resultado esperado:

```text
DatabaseSnapshot
       ↓
     Rules
       ↓
   Finding[]
```

## Fase 4 — Primeras reglas de seguridad

Objetivo: empezar a detectar configuraciones reales que requieran revisión.

### Áreas iniciales

- Row Level Security.
- Policies.
- Roles.
- Grants.
- Acceso excesivo.
- Configuraciones potencialmente inseguras.

Cada regla debe incluir:

1. documentación;
2. evidencia;
3. explicación;
4. recomendación;
5. tests positivos;
6. tests negativos.

## Fase 5 — API

Objetivo: exponer el análisis mediante el servidor Express.

### Pasos

1. Endpoint de conexión o validación.
2. Endpoint para iniciar análisis.
3. Integración con `packages/postgres`.
4. Integración con `packages/core`.
5. Manejo de errores.
6. Validación con Zod.

Resultado esperado:

```text
HTTP request
    ↓
Express
    ↓
PostgreSQL + Core
    ↓
JSON Findings
```

## Fase 6 — Interfaz web

Objetivo: permitir utilizar pgArmor sin depender de terminal o API manual.

### Pasos

1. Pantalla de conexión.
2. Estado de conexión.
3. Inicio del análisis.
4. Resumen de resultados.
5. Lista de hallazgos.
6. Vista detallada de cada hallazgo.
7. Explicaciones y recomendaciones.

## Fase 7 — Primera versión utilizable

Objetivo: preparar una primera versión pública que pueda probarse con bases PostgreSQL reales.

### Pasos

1. Mejorar manejo de errores.
2. Revisar seguridad de credenciales.
3. Ampliar tests.
4. Validar compatibilidad entre versiones PostgreSQL.
5. Documentar instalación con Docker.
6. Preparar primera release.

## Futuro

Después de estabilizar la versión servidor se podrá evaluar:

- más reglas;
- reportes exportables;
- SQL sugerido;
- perfiles de análisis;
- versión desktop con Tauri;
- integraciones con CI/CD.

La prioridad seguirá siendo que el motor de análisis pueda evolucionar independientemente de la forma en que pgArmor se distribuya.
