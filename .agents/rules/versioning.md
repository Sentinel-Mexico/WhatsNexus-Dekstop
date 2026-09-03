# Regla de Versionamiento Semántico (SemVer)

Para cada nueva solicitud o conjunto de cambios aplicados en el código, el agente debe evaluar el impacto de las modificaciones para determinar el nuevo número de versión en `package.json`. El formato estricto a seguir es: MAYOR.MENOR.PARCHE (Ejemplo: 2.1.0).

El agente debe incrementar la versión siguiendo estas reglas lógicas:

1. **INCREMENTO DE PARCHE** (Tercer dígito - ej. de 2.1.0 a 2.1.1):
Aplica este incremento cuando la solicitud consista únicamente en cambios retrocompatibles (backward-compatible) que no alteran la funcionalidad principal.
- Casos de uso: Corrección de errores (bug fixes), parches de seguridad, pequeños ajustes de interfaz de usuario (UI), refactorización de código interno, optimización de rendimiento o actualización de dependencias menores.

2. **INCREMENTO MENOR** (Segundo dígito - ej. de 2.1.0 a 2.2.0):
Aplica este incremento cuando la solicitud introduzca nueva funcionalidad o características al software, pero manteniendo la compatibilidad con las versiones anteriores. Al hacer esto, el dígito de PARCHE debe reiniciarse a 0.
- Casos de uso: Agregar una nueva herramienta, incorporar un nuevo menú de configuraciones, añadir soporte para un nuevo idioma, o integrar una nueva API que no rompa la estructura actual.

3. **INCREMENTO MAYOR** (Primer dígito - ej. de 2.1.0 a 3.0.0):
Aplica este incremento cuando la solicitud implique cambios drásticos o incompatibles que rompan la retrocompatibilidad o cambien el núcleo de la aplicación. Al hacer esto, los dígitos de MENOR y PARCHE deben reiniciarse a 0.
- Casos de uso: Cambios profundos en la arquitectura (ej. cambiar de PyQt6 a Electron), rediseño total de la interfaz que altera drásticamente la experiencia del usuario (UX), o modificaciones en la base de datos que requieren una migración incompatible.

> **NOTA IMPORTANTE (Fase Beta / Desarrollo Inicial):**
> Actualmente el proyecto se encuentra en fase de desarrollo inicial (versión `0.x.x`). Durante esta fase, el primer dígito (MAYOR) se mantendrá en `0`. Cualquier nueva funcionalidad incrementará el dígito MENOR (ej. de `0.1.0` a `0.2.0`), y las correcciones de errores incrementarán el dígito PARCHE (ej. de `0.1.0` a `0.1.1`). El salto a la versión `1.0.0` solo ocurrirá cuando el usuario indique explícitamente que la aplicación ha alcanzado su primera versión estable y finalizada.

> **REGLA DE SINCRONIZACIÓN DE VERSIONES:**
> Siempre que se realice un cambio de versión, este debe reflejarse en **todos** los archivos donde esté definida la versión. En este proyecto Node.js, debes modificar el `package.json` y posteriormente ejecutar `npm install` (o `npm update`) para garantizar que el `package-lock.json` u otros archivos generados se sincronicen correctamente con la nueva versión.

> **REGLA DE FORMATO DE MENSAJES DE COMMIT Y PUSH:**
> Cada vez que se prepare un commit o push a Git, el mensaje debe comenzar estrictamente con el prefijo de la versión actual seguido del tipo de cambio y el resumen de la actualización.
> Formato requerido: `"v.<VERSION> <tipo>: <resumen>"`
> Ejemplo: `"v.0.3.1 perf: implement lazy loading on startup, debounce preload observers, ..."`

**Instrucción final para el agente:** Cada vez que entregues un código actualizado, incluye un breve comentario en tu respuesta indicando qué tipo de incremento aplicaste (Parche, Menor o Mayor) y la justificación basada en estas reglas.
