# Preparar y publicar la extensión

La versión 0.3.0 se distribuye como VSIX. Empaquetar no publica en Marketplace. El manifiesto usa `publisher: "AgustinSanchez"`, que debe coincidir con el publisher de Marketplace.

## Preparar el paquete

Desde `vscode-extension/`, con una versión de Node.js compatible con las dependencias de desarrollo:

```bash
npm ci
npm run verify
npm run package
```

`verify` compila, ejecuta las pruebas y lista los archivos que incluirá el paquete. `package` vuelve a ejecutar las pruebas y usa la instalación local de `@vscode/vsce` para generar `banco-de-prompts-0.3.0.vsix`. No requiere instalar `vsce` globalmente.

El script de empaquetado configura las URL de imágenes y documentación para la carpeta `vscode-extension/` del repositorio. Si cambiás el repositorio o la rama, actualizá `--baseContentUrl` y `--baseImagesUrl` en `package.json`. Subí esos archivos al repositorio antes de publicar para que Marketplace pueda mostrarlos.

Instalá ese archivo en un perfil de prueba de VS Code con **Extensions → … → Install from VSIX…**. Usá una instancia de prueba de Banco de prompts y conversaciones sin datos privados.

## Prueba manual en VS Code

- [ ] El panel aparece en la barra de actividad y se adapta a temas claro, oscuro y alto contraste.
- [ ] Los controles se recorren con teclado; textos y acciones se leen con el panel angosto.
- [ ] URL y token se pueden configurar, comprobar y eliminar sin exponer el secreto.
- [ ] App apagada, token incorrecto y servidor sin `IMPORT_TOKEN` producen errores comprensibles.
- [ ] Cambiar la URL no reutiliza el token de otro servidor.
- [ ] El ajuste global antiguo se migra a SecretStorage.
- [ ] Importación manual y cada fuente disponible guardan los turnos elegidos en una sesión nueva y en una existente.
- [ ] Cancelar un selector no importa contenido.
- [ ] Un servidor sin proyectos muestra la instrucción para crearlos.
- [ ] El enlace de resultado abre la sesión correcta; el historial muestra como máximo ocho importaciones.
- [ ] Limpiar el historial sólo borra los accesos locales; las sesiones siguen disponibles en la app.
- [ ] Las rutas locales funcionan en los sistemas operativos anunciados y se documentan las limitaciones encontradas.

Las pruebas automatizadas no reemplazan esta revisión del VSIX instalado ni la comprobación con una app real.

## Lista de release

- [ ] Versión consistente en manifiesto, lockfile y changelog.
- [ ] `npm run verify` y `npm run package` terminan correctamente.
- [ ] Pruebas de la app y autenticación de `/api/import` aprobadas.
- [ ] README, privacidad, licencia MIT e icono incluidos y legibles en el paquete.
- [ ] VSIX sin `.env`, credenciales, conversaciones, archivos de prueba ni dependencias de desarrollo.
- [ ] Enlaces del repositorio públicos y correctos; capturas sin datos personales.
- [ ] Identidad `publisher` y permisos de la cuenta confirmados.
- [ ] Prueba manual completada y autorización de publicación obtenida.

## Subir a Marketplace

1. Iniciá sesión en [administración de publishers](https://marketplace.visualstudio.com/manage/publishers/).
2. Confirmá el acceso al publisher `AgustinSanchez`. Si usás otro publisher, actualizá el manifiesto antes de volver a empaquetar.
3. Creá una extensión de Visual Studio Code y cargá el VSIX revisado. Para una extensión existente, cargá una nueva versión desde su administración.
4. Revisá la ficha, el resultado de validación y la instalación desde Marketplace.

Este es el flujo manual documentado por Microsoft. Si luego automatizás releases, seguí sus instrucciones vigentes de autenticación con Microsoft Entra ID. [Guía oficial de publicación](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

La publicación real debe realizarse únicamente después de la aprobación del responsable del proyecto.
