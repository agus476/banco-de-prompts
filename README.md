# Banco de prompts

Una biblioteca de prompts reutilizables y una bitácora para conservar el trabajo real con IA. La extensión de VS Code permite llevar conversaciones de Codex, Copilot Chat y Cursor a tus proyectos, eligiendo qué interacciones guardar.

El repositorio contiene dos aplicaciones:

| Componente | Función |
| --- | --- |
| App web, en la raíz | Biblioteca, proyectos, sesiones, materias y exportación de bitácoras. |
| [Extensión de VS Code](./vscode-extension/README.md) | Panel lateral, importación de chats locales y registro manual. Requiere conectarse a la app web. |

## Iniciar la app web

Necesitás Node.js 22 o superior, PostgreSQL y un proyecto de Supabase para autenticación por email y contraseña.

1. Copiá [`.env.example`](./.env.example) a `.env` y completá las conexiones PostgreSQL, las credenciales públicas de Supabase y `IMPORT_TOKEN`.
2. Creá tu usuario de acceso en Authentication del proyecto de Supabase. La app tiene inicio de sesión, sin formulario de registro.
3. Instalá y prepará una base destinada a esta aplicación:

```bash
npm ci
npm run db:push
npm run db:seed
npm run dev
```

Abrí [localhost:3000](http://localhost:3000), iniciá sesión y creá una materia y un proyecto. El seed agrega categorías y ejemplos de prompts; no reemplaza la configuración de autenticación.

`DATABASE_URL` es la conexión que usa la aplicación y `DIRECT_URL` la conexión directa para administrar el esquema con Prisma. Si usás PostgreSQL de Supabase, copiá las cadenas correspondientes desde su panel de conexión. No subas `.env` al repositorio.

## Conectar VS Code

Instalar la extensión no instala ni inicia el servidor. Con la app disponible y al menos un proyecto creado:

1. Instalá el VSIX y abrí el panel **Banco de prompts**.
2. Configurá `banco.apiUrl` con la URL de la app.
3. Guardá en la extensión el mismo `IMPORT_TOKEN` configurado en el servidor.
4. Comprobá la conexión e importá un chat o una interacción manual.

El token es obligatorio también en localhost. Las URLs remotas requieren HTTPS; HTTP se permite únicamente con `localhost`, `127.0.0.1` o `[::1]`. La extensión guarda el token mediante SecretStorage de VS Code, asociado a cada URL.

La [guía de la extensión](./vscode-extension/README.md) detalla la instalación, las fuentes compatibles y la solución de errores.

## Biblioteca y bitácora

| Biblioteca | Bitácora |
| --- | --- |
| Prompts editables con categorías, tags y favoritos. | Sesiones e interacciones de un proyecto concreto. |
| Diseñada para encontrar y reutilizar. | Diseñada para reconstruir decisiones y resultados. |
| El contenido puede evolucionar. | Cada interacción conserva su propio texto. |

Copiar un prompt de la biblioteca a una sesión no vincula sus futuras ediciones. La herramienta organiza el contenido registrado; no genera respuestas ni una defensa académica.

Para entregar una bitácora, abrí el proyecto y usá **Preparar entrega → Vista para PDF**, o descargá Markdown o texto plano.

## Arquitectura

Next.js App Router y React, PostgreSQL con Prisma, y Supabase Auth para la web. La API `/api/import` usa un token independiente de la sesión del navegador. Este proyecto está orientado a una instancia personal: los registros no están separados por usuario.

```text
src/app/              Rutas, páginas y API de importación
src/actions/          Mutaciones de la app
src/components/       Interfaz web
src/lib/              Consultas, autenticación, importación y exportación
prisma/               Esquema PostgreSQL y datos iniciales
vscode-extension/     Extensión instalable y documentación de publicación
```

## Desarrollo y publicación

En la raíz:

```bash
npm test
npm run lint
npm run build
```

Para compilar, probar y empaquetar la extensión, seguí [PUBLISHING.md](./vscode-extension/PUBLISHING.md). La extensión tiene licencia [MIT](./vscode-extension/LICENSE); sus prácticas de datos están en [PRIVACY.md](./vscode-extension/PRIVACY.md).
