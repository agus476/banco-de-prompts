# Privacidad

Esta información corresponde a Banco de prompts para VS Code, versión 0.3.0.

## Archivos locales

Al ejecutar un comando de importación, la extensión examina los directorios de conversaciones compatibles de Codex, Copilot Chat o Cursor. Lee contenido y metadatos para construir la lista de chats y recuperar sus turnos. Los archivos originales no se modifican.

La carpeta abierta en VS Code se usa para priorizar conversaciones relacionadas. En el registro manual, el texto seleccionado en el editor puede completar el campo del prompt; podés editarlo antes de guardarlo.

## Datos enviados

La comprobación de conexión y la selección de destino consultan proyectos y sesiones mediante `GET /api/import`. Guardar un token también inicia una comprobación de conexión. La importación envía mediante `POST /api/import` los prompts y respuestas seleccionados, la herramienta, la fuente, la fecha de captura y el destino elegido.

Las solicitudes se dirigen a la URL configurada por el usuario y llevan su token de importación. La extensión no implementa telemetría, analítica publicitaria ni conexiones a APIs de proveedores de IA. No envía chats de forma automática en segundo plano.

Una vez importado, el contenido se conserva en la base de datos de la app. Su acceso, conservación, copias de seguridad y eliminación dependen de esa instancia. El responsable del servidor puede acceder a esos datos. Revisá los turnos antes de enviar información sensible.

## Almacenamiento en VS Code

- **Token:** SecretStorage de VS Code, asociado a cada URL. El ajuste global antiguo se migra y se elimina de la configuración global. Los valores antiguos que permanezcan en copias de seguridad o archivos del workspace deben eliminarse por separado.
- **Preferencias:** URL de la app, herramienta y proyecto predeterminados en la configuración de VS Code.
- **Historial:** hasta ocho importaciones en el almacenamiento local de la extensión, con fuente, fecha, cantidad y URL de destino. No incluye prompts ni respuestas.

Podés usar **Banco: Eliminar token de importación** y **Banco: Limpiar historial local de importaciones** para eliminar esos datos de la extensión. Esto no elimina las interacciones guardadas en el servidor. La desinstalación de la extensión tampoco borra datos de la app ni los archivos originales de conversación.

## Contacto

Para consultas sobre el comportamiento de la extensión, usá las [incidencias del repositorio](https://github.com/agus476/banco-de-prompts/issues). No incluyas tokens, conversaciones privadas ni credenciales en un reporte público.
