# Contributing to pgArmor

Gracias por colaborar con pgArmor.

Antes de comenzar, revisa:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)

## Flujo básico

1. Busca o crea un Issue.
2. Parte desde `develop`.
3. Crea una rama `feature/*`, `fix/*` o `docs/*`.
4. Desarrolla y prueba tus cambios.
5. Envía un Pull Request hacia `develop`.
6. Espera revisión antes de hacer merge.

No desarrolles directamente sobre `main` ni `develop`.

## Cambios importantes

Antes de implementar cambios relacionados con:

- arquitectura;
- estructura de paquetes;
- reglas de seguridad;
- formato de findings;
- permisos;
- ejecución de SQL sobre bases analizadas;

abre o participa en un Issue para discutir la propuesta.

## Pull Requests

Procura que cada PR resuelva un único problema.

Incluye:

- referencia al Issue;
- explicación breve;
- pasos para probar;
- tests necesarios;
- documentación cuando corresponda.

## Seguridad

Durante las primeras fases, pgArmor está orientado principalmente a lectura, introspección y análisis.

No agregues funcionalidades que modifiquen automáticamente la base PostgreSQL analizada sin que hayan sido discutidas y aprobadas previamente.
