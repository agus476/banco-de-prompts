# Banco de prompts y bitácora de IA

Aplicación personal para dos usos que conviven, pero no se mezclan:

1. **Biblioteca** — prompts reutilizables: guardar, encontrar, ver, copiar.
2. **Bitácora** — evidencia real del trabajo con IA en un trabajo práctico.

La aplicación no genera prompts, respuestas ni decisiones. Solo organiza lo que vos registrás y lo exporta tal cual.

## Cómo correrla

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Tests: `npm test`

## Diseño

### Biblioteca vs bitácora

| Biblioteca | Bitácora |
| --- | --- |
| Prompts genéricos, editables, con categorías y tags | Registro cronológico de un trabajo concreto |
| El valor es reutilizar | El valor es poder reconstruir el proceso |
| Se puede cambiar después | Cada iteración guarda un snapshot del texto usado |

Un prompt de bitácora puede nacer ahí, venir de la biblioteca, o copiarse después a la biblioteca. En todos los casos la bitácora conserva su propio texto: si editás el prompt de la biblioteca, la evidencia académica no cambia.

### Modelo de datos

- `Category` 1—n `Prompt`
- `Prompt` n—n `Tag` (tabla `PromptTag`)
- `Subject` 1—n `Project`
- `Project` 1—n `Session`
- `Session` 1—n `Interaction`
- `Interaction.libraryPromptId` opcional → `Prompt`

SQLite + Prisma. Los ids son `cuid` y no hay tipos propios de SQLite, para poder pasar a PostgreSQL cambiando el `provider` y la URL.

### Arquitectura

Un solo proyecto Next.js (App Router).

- Lectura en Server Components
- Mutaciones en Server Actions
- Exportación en un Route Handler (`/proyectos/[id]/exportar`) y vista de entrega imprimible (`/proyectos/[id]/bitacora`)
- Persistencia en `src/lib/*`
- Sin autenticación, ni API pública, ni servicios extra

```text
src/
  app/            rutas (biblioteca, proyectos, bitácoras, materias)
  actions/        mutaciones
  components/     UI
  lib/            Prisma, consultas, exportación
prisma/
  schema.prisma
  seed.ts
```

### MVP

Incluido: CRUD de prompts, categorías, tags, favoritos, búsqueda y copiado; proyectos, materias, sesiones e interacciones; vínculo biblioteca ↔ bitácora; modo oscuro; exportación Markdown, texto plano y vista para guardar como PDF.

Fuera de alcance: login, multi-usuario, cloud, embeddings, scrape automático de chats, DOCX, adjuntos, Git, variables de prompts.

### Importar desde VS Code / Cursor

Hay un endpoint local `POST /api/import` y una extensión en `vscode-extension/`.

Mandás JSON con `interaction.prompt` + `interaction.response` (o un array `interactions`). La app lo guarda en una sesión de bitácora **tal cual**.

Paso a paso de instalación y uso: [`vscode-extension/README.md`](./vscode-extension/README.md).

### Riesgos que el modelo evita

- **Mutar evidencia al editar un prompt de la biblioteca.** Se copia el texto a la interacción.
- **Inventar contenido en la exportación.** Las secciones vacías se omiten o se marcan como no registradas.
- **Acoplar SQLite de más.** Sin enums nativos ni tipos binarios específicos.

## Entregar una bitácora

1. Abrí el proyecto.
2. En **Preparar entrega** → **Vista para PDF**.
3. Revisá el documento.
4. **Imprimir / Guardar PDF** y, en el diálogo del navegador, elegí *Guardar como PDF*.

También podés descargar Markdown o texto plano si el docente pide un archivo adjunto editable. La exportación no inventa prompts, respuestas ni decisiones.

## Uso académico

Esta herramienta ayuda a conservar el proceso. No escribe la defensa por vos. En la entrega tenés que poder explicar el código, las decisiones y las iteraciones con lo que realmente hiciste.
