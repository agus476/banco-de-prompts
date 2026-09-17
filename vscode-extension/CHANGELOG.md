# Cambios

## 0.3.0

- Nuevo panel lateral con accesos a Codex, Copilot Chat, Cursor y registro manual.
- Estado de conexión y comprobación iniciada por el usuario.
- Historial local de las últimas ocho importaciones, sin guardar su contenido.
- Token por URL en SecretStorage y migración del antiguo ajuste global.
- Validación de URL, HTTPS para servidores remotos, tiempo límite de solicitudes y errores de API más claros.
- Autenticación de importación unificada: token obligatorio, respuestas JSON y soporte de Bearer en el servidor.
- Organización del código en módulos de conexión, configuración, comandos e interfaz.
- Lectura de chats más robusta, reconstrucción de arrays JSONL y detección de rutas estándar en Windows, macOS y Linux.
- Importación a sesiones existentes sin conflictos de numeración y conservación del destino elegido durante todo el flujo.
- Preparación del paquete para Marketplace, documentación de privacidad y licencia MIT.

**Cambio de configuración:** `IMPORT_TOKEN` es obligatorio en el servidor y en la extensión, también para uso local. Si el servidor no lo tiene definido, la API responde `503`.

## 0.2.0

- Importación de conversaciones locales de Codex, Copilot Chat y Cursor.
- Selección de turnos, proyecto y sesión de destino.
- Registro manual de prompt y respuesta.
