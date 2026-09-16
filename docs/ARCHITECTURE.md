# Arquitectura

## Objetivo

La arquitectura de pgArmor busca resolver un problema principal: **el análisis de PostgreSQL no debe depender directamente de la interfaz, del servidor HTTP ni de una forma específica de distribuir la aplicación**.

La primera versión se desarrollará como una aplicación web con servidor, pero la lógica principal debe mantenerse separada para que, en el futuro, pueda reutilizarse en otras distribuciones sin reescribir el motor de análisis.

Para mantener el proyecto sencillo para colaboradores nuevos, toda la lógica del backend vive inicialmente dentro de `apps/server/src/`.

---

## Cómo fluye la información

Cuando un usuario solicite analizar una base PostgreSQL, la aplicación seguirá este recorrido:

```text
Interfaz web
    ↓
Servidor Express
    ↓
Módulo PostgreSQL
    ↓
Información normalizada
    ↓
Core de análisis
    ↓
Hallazgos
    ↓
Servidor Express
    ↓
Interfaz web
```

La idea es que cada parte tenga una responsabilidad clara y que la lógica de seguridad no quede mezclada con la interfaz o con Express.

---

## Estructura del servidor

```text
apps/server/src/
├── routes/
├── controllers/
├── services/
├── middlewares/
├── postgres/
│   ├── connection/
│   ├── collectors/
│   └── types/
├── core/
│   ├── rules/
│   ├── analyzer/
│   └── types/
└── index.ts
```

### `routes/`

Define las rutas HTTP disponibles en la API.

Ejemplo:

```text
POST /analysis
GET /health
```

Las rutas no deben contener lógica de negocio.

---

### `controllers/`

Reciben las solicitudes de Express y construyen las respuestas HTTP.

Su responsabilidad principal es:

- recibir datos;
- llamar al servicio correspondiente;
- devolver una respuesta;
- manejar errores relacionados con HTTP.

No deben contener reglas de seguridad ni consultas complejas a PostgreSQL.

---

### `services/`

Coordinan los casos de uso de la aplicación.

Por ejemplo, un servicio de análisis podría:

1. solicitar información al módulo PostgreSQL;
2. generar un snapshot;
3. enviarlo al core;
4. devolver los hallazgos al controller.

Los servicios funcionan como el punto de coordinación entre las distintas partes del backend.

---

### `middlewares/`

Contiene lógica transversal utilizada por Express.

Por ejemplo:

- manejo de errores;
- validación;
- seguridad;
- autenticación futura;
- logging.

Los middlewares no deben contener lógica específica del análisis de PostgreSQL.

---

### `postgres/`

Este módulo es responsable de comunicarse con la base PostgreSQL que el usuario desea analizar.

Puede consultar catálogos como:

```text
pg_catalog
information_schema
```

para obtener información sobre:

- versión de PostgreSQL;
- schemas;
- tablas;
- roles;
- membresías;
- permisos;
- Row Level Security;
- policies;
- grants.

#### `postgres/connection/`

Responsable de crear y manejar la conexión con PostgreSQL.

#### `postgres/collectors/`

Contiene funciones encargadas de recopilar información específica.

Ejemplos:

```text
rolesCollector
tablesCollector
policiesCollector
grantsCollector
```

#### `postgres/types/`

Contiene tipos relacionados con la información obtenida directamente desde PostgreSQL.

El módulo `postgres` **obtiene información**, pero no decide por sí mismo si una configuración es segura o insegura.

---

## Representación de la base

El resto del sistema no debería depender directamente de las respuestas específicas de PostgreSQL.

Por eso, la información obtenida debe transformarse a una estructura interna común.

Conceptualmente:

```text
PostgreSQL real
      ↓
Introspección
      ↓
DatabaseSnapshot
```

Un `DatabaseSnapshot` representa el estado de seguridad relevante de una base en un momento determinado.

Podría contener información como:

```text
DatabaseSnapshot
├── version
├── schemas
├── tables
├── roles
├── memberships
├── policies
└── grants
```

Esto también permite probar el motor de análisis usando datos simulados sin necesitar una base PostgreSQL real en cada test.

---

## `core/`

El directorio `core` contiene la lógica principal de análisis de pgArmor.

El core recibe información normalizada y ejecuta reglas sobre ella.

Conceptualmente:

```ts
analyze(snapshot)
```

Debe poder responder preguntas como:

- ¿Hay tablas con RLS configurado incorrectamente?
- ¿Existen roles con permisos excesivos?
- ¿Hay policies potencialmente demasiado permisivas?
- ¿Existen grants que requieren revisión?
- ¿Hay configuraciones inconsistentes relacionadas con acceso o ownership?

### `core/rules/`

Contiene las reglas individuales de análisis.

Cada regla debe analizar una condición concreta y generar un hallazgo cuando corresponda.

### `core/analyzer/`

Coordina la ejecución de las reglas.

Recibe un `DatabaseSnapshot`, ejecuta las reglas registradas y devuelve los resultados.

### `core/types/`

Contiene tipos propios del motor de análisis.

Por ejemplo:

```text
Finding
Rule
Severity
Category
```

El core **no debe conectarse directamente a PostgreSQL** y tampoco debe depender de Express.

---

## Hallazgos

Cada regla debe producir información estructurada.

Conceptualmente:

```text
Finding
├── ruleId
├── title
├── severity
├── object
├── evidence
├── explanation
├── recommendation
└── references
```

Esto permite que la interfaz pueda mostrar cualquier hallazgo sin conocer cómo funciona internamente cada regla.

---

## Flujo interno del servidor

El flujo general será:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Postgres
  ↓
Core
  ↓
Resultado
```

No todas las operaciones necesitarán utilizar todos los pasos, pero esta separación sirve como guía general.

Por ejemplo:

```text
POST /analysis
      ↓
analysisController
      ↓
analysisService
      ↓
postgres collectors
      ↓
DatabaseSnapshot
      ↓
core analyzer
      ↓
Finding[]
      ↓
HTTP Response
```

---

## Límites entre módulos

Estas separaciones deben mantenerse durante el desarrollo:

```text
React
  NO consulta PostgreSQL directamente.

Routes
  NO contienen lógica de negocio.

Controllers
  NO implementan reglas de seguridad.

Services
  coordinan operaciones.

postgres
  obtiene y normaliza información.
  NO decide si algo es inseguro.

core
  analiza información.
  NO conoce Express.
  NO realiza conexiones reales a PostgreSQL.
```

Mantener estos límites permitirá que el código sea más fácil de entender, probar y modificar.

---

## Por qué no usamos `packages/` por ahora

Una alternativa sería separar `core`, `postgres` y otros módulos como paquetes independientes dentro de un monorepo.

Por ejemplo:

```text
packages/core
packages/postgres
packages/shared
```

Sin embargo, pgArmor busca ser accesible también para desarrolladores con poca experiencia.

Mantener estas partes dentro de:

```text
apps/server/src/
```

reduce la cantidad de conceptos necesarios para empezar a contribuir.

La separación importante en esta etapa es **lógica y arquitectónica**, no necesariamente física mediante paquetes independientes.

---

## Evolución futura

Aunque actualmente `core` y `postgres` viven dentro del servidor, deben mantenerse desacoplados de Express.

Si pgArmor incorpora una versión de escritorio con Tauri en el futuro, será posible extraer estos módulos a paquetes reutilizables.

Por ejemplo:

```text
apps/server/src/core
        ↓
packages/core
```

El mismo principio puede aplicarse al módulo PostgreSQL.

La prioridad actual es mantener una arquitectura clara y sencilla sin añadir complejidad antes de que sea necesaria.
